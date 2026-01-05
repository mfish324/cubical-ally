"""
Celery tasks for the progress app.
"""
import logging
from datetime import datetime, timedelta

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_checkin_reminder(self, user_id):
    """
    Send a check-in reminder email to a user.

    Args:
        user_id: UUID of the user to remind
    """
    from django.contrib.auth import get_user_model
    from users.models import UserProfile

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
        profile = UserProfile.objects.get(user=user)

        if not profile.checkin_enabled:
            logger.info(f"Check-in disabled for user {user.email}, skipping")
            return

        # Send email reminder
        subject = "Time for your weekly check-in!"
        context = {
            'user': user,
            'profile': profile,
            'dashboard_url': f"{settings.FRONTEND_URL}/dashboard",
        }

        # Try to render HTML email, fallback to plain text
        try:
            html_message = render_to_string('emails/checkin_reminder.html', context)
        except Exception:
            html_message = None

        plain_message = f"""
Hi {user.first_name or 'there'},

It's time for your weekly CubicleAlly check-in!

Take a few minutes to:
- Document any wins from this week
- Update your skill progress
- Review your readiness score

Your current readiness for {profile.target_occupation_title or 'your target role'}: {profile.readiness_score or 0}%

Log in to capture your progress: {settings.FRONTEND_URL}/dashboard

Keep climbing!
The CubicleAlly Team
        """.strip()

        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Check-in reminder sent to {user.email}")

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
    except UserProfile.DoesNotExist:
        logger.error(f"Profile not found for user {user_id}")
    except Exception as exc:
        logger.error(f"Failed to send check-in reminder: {exc}")
        raise self.retry(exc=exc, countdown=60 * 5)  # Retry in 5 minutes


@shared_task
def schedule_checkin_reminders():
    """
    Scheduled task that runs daily to find users who need check-in reminders.
    This should be scheduled to run at midnight UTC.
    """
    from django.contrib.auth import get_user_model
    from users.models import UserProfile

    User = get_user_model()
    today = timezone.now()
    current_day = today.weekday()  # 0=Monday, 6=Sunday

    # Find users whose check-in day is today
    profiles = UserProfile.objects.filter(
        checkin_enabled=True,
        checkin_day=current_day,
    ).select_related('user')

    scheduled_count = 0
    for profile in profiles:
        # Check if we should send (based on checkin_time if set)
        if profile.checkin_time:
            # Schedule for the specific time
            scheduled_time = timezone.now().replace(
                hour=profile.checkin_time.hour,
                minute=profile.checkin_time.minute,
                second=0,
                microsecond=0
            )
            if scheduled_time > timezone.now():
                send_checkin_reminder.apply_async(
                    args=[str(profile.user.id)],
                    eta=scheduled_time
                )
            else:
                # Time already passed, send now
                send_checkin_reminder.delay(str(profile.user.id))
        else:
            # No specific time, send immediately
            send_checkin_reminder.delay(str(profile.user.id))

        scheduled_count += 1

    logger.info(f"Scheduled {scheduled_count} check-in reminders for today")
    return scheduled_count


@shared_task
def refresh_readiness_scores():
    """
    Periodic task to refresh readiness scores for all users with targets.
    Runs weekly to ensure scores stay up-to-date.
    """
    from django.contrib.auth import get_user_model
    from users.models import UserProfile
    from skills.models import Occupation
    from progress.services import compute_gap_analysis

    User = get_user_model()

    profiles = UserProfile.objects.filter(
        target_occupation_code__isnull=False,
    ).exclude(
        target_occupation_code=''
    ).select_related('user')

    updated_count = 0
    for profile in profiles:
        try:
            target = Occupation.objects.get(
                onet_soc_code=profile.target_occupation_code
            )
            analysis = compute_gap_analysis(profile.user, target)

            # Update cached readiness score in profile
            profile.readiness_score = analysis.readiness_score
            profile.save(update_fields=['readiness_score', 'updated_at'])
            updated_count += 1

        except Occupation.DoesNotExist:
            logger.warning(
                f"Target occupation {profile.target_occupation_code} not found "
                f"for user {profile.user.email}"
            )
        except Exception as exc:
            logger.error(
                f"Failed to refresh readiness for {profile.user.email}: {exc}"
            )

    logger.info(f"Refreshed readiness scores for {updated_count} users")
    return updated_count


@shared_task(bind=True, max_retries=3)
def generate_document_async(self, user_id, audience, tone, emphasis=None):
    """
    Async task to generate a promotion document.
    Useful for offloading AI generation from the request cycle.

    Args:
        user_id: UUID of the user
        audience: Target audience for the document
        tone: Tone of the document
        emphasis: Optional emphasis text
    """
    from django.contrib.auth import get_user_model
    from users.models import UserProfile
    from skills.models import Occupation
    from documents.models import GeneratedDocument
    from documents.services.generator import gather_document_context
    from ai_services.services import generate_document

    User = get_user_model()

    try:
        user = User.objects.get(id=user_id)
        profile = UserProfile.objects.get(user=user)

        if not profile.target_occupation_code:
            logger.error(f"No target occupation for user {user_id}")
            return None

        target = Occupation.objects.get(
            onet_soc_code=profile.target_occupation_code
        )

        # Gather context
        context = gather_document_context(user, target)

        # Generate with AI
        result = generate_document(
            context=context,
            audience=audience,
            tone=tone,
            emphasis=emphasis,
        )

        # Get version number
        last_doc = GeneratedDocument.objects.filter(
            user=user,
            target_occupation=target
        ).order_by('-version').first()
        version = (last_doc.version + 1) if last_doc else 1

        # Save document
        doc = GeneratedDocument.objects.create(
            user=user,
            target_occupation=target,
            tone=tone,
            audience=audience,
            content_markdown=result['content'],
            version=version,
        )

        logger.info(f"Generated document {doc.id} for user {user.email}")
        return str(doc.id)

    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return None
    except Exception as exc:
        logger.error(f"Failed to generate document: {exc}")
        raise self.retry(exc=exc, countdown=30)


@shared_task
def cleanup_old_documents(days=90):
    """
    Clean up documents older than specified days.
    Keeps the most recent 5 versions per user/target combination.
    """
    from documents.models import GeneratedDocument

    cutoff_date = timezone.now() - timedelta(days=days)

    # Find documents to delete (older than cutoff, not in top 5 per user/target)
    deleted_count = 0

    # Get unique user/target combinations
    combinations = GeneratedDocument.objects.values(
        'user', 'target_occupation'
    ).distinct()

    for combo in combinations:
        # Keep top 5 by version
        keep_ids = GeneratedDocument.objects.filter(
            user=combo['user'],
            target_occupation=combo['target_occupation']
        ).order_by('-version').values_list('id', flat=True)[:5]

        # Delete old ones not in keep list
        deleted, _ = GeneratedDocument.objects.filter(
            user=combo['user'],
            target_occupation=combo['target_occupation'],
            generated_at__lt=cutoff_date
        ).exclude(
            id__in=keep_ids
        ).delete()

        deleted_count += deleted

    logger.info(f"Cleaned up {deleted_count} old documents")
    return deleted_count
