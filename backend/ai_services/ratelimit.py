"""
Rate limiting utilities for AI endpoints.

This module provides rate limiting decorators and utilities to protect
expensive AI endpoints from abuse and control costs.
"""
import functools
import logging
from django.core.cache import cache
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response

logger = logging.getLogger(__name__)

# Rate limit configurations (requests per time window in seconds)
RATE_LIMITS = {
    'ai_interpret': {'limit': 10, 'window': 60},        # 10 per minute
    'ai_enhance': {'limit': 20, 'window': 60},          # 20 per minute
    'ai_coaching': {'limit': 15, 'window': 60},         # 15 per minute
    'ai_document': {'limit': 5, 'window': 300},         # 5 per 5 minutes
    'ai_paths': {'limit': 10, 'window': 60},            # 10 per minute
    'ai_default': {'limit': 30, 'window': 60},          # Default: 30 per minute
}

# Pro tier multipliers
PRO_MULTIPLIER = 3


def get_rate_limit_key(user, endpoint_type):
    """Generate a cache key for rate limiting."""
    if user and user.is_authenticated:
        return f"ratelimit:{endpoint_type}:user:{user.id}"
    return f"ratelimit:{endpoint_type}:anon"


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def check_rate_limit(request, endpoint_type='ai_default'):
    """
    Check if request is within rate limits.

    Returns:
        tuple: (allowed: bool, remaining: int, reset_time: int)
    """
    config = RATE_LIMITS.get(endpoint_type, RATE_LIMITS['ai_default'])
    limit = config['limit']
    window = config['window']

    # Apply pro multiplier for pro users
    user = request.user if hasattr(request, 'user') else None
    if user and user.is_authenticated:
        if getattr(user, 'subscription_tier', 'free') == 'pro':
            limit *= PRO_MULTIPLIER

    # Get rate limit key
    if user and user.is_authenticated:
        key = get_rate_limit_key(user, endpoint_type)
    else:
        # For anonymous users, use IP
        ip = get_client_ip(request)
        key = f"ratelimit:{endpoint_type}:ip:{ip}"

    # Get current count
    current = cache.get(key, 0)

    if current >= limit:
        # Get TTL to report reset time
        ttl = cache.ttl(key) if hasattr(cache, 'ttl') else window
        return False, 0, ttl or window

    # Increment counter
    if current == 0:
        cache.set(key, 1, window)
    else:
        try:
            cache.incr(key)
        except ValueError:
            cache.set(key, 1, window)

    remaining = limit - current - 1
    return True, remaining, window


def rate_limit_response(endpoint_type='ai_default', remaining=0, reset_time=60):
    """Generate a rate limit exceeded response."""
    return Response(
        {
            'error': 'Rate limit exceeded',
            'message': 'Too many requests. Please try again later.',
            'retry_after': reset_time,
        },
        status=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={
            'X-RateLimit-Remaining': str(remaining),
            'X-RateLimit-Reset': str(reset_time),
            'Retry-After': str(reset_time),
        }
    )


def ai_rate_limit(endpoint_type='ai_default'):
    """
    Decorator to add rate limiting to AI endpoints.

    Usage:
        @ai_rate_limit('ai_interpret')
        def post(self, request):
            ...
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        def wrapped_view(self, request, *args, **kwargs):
            allowed, remaining, reset_time = check_rate_limit(request, endpoint_type)

            if not allowed:
                user_info = request.user.email if request.user.is_authenticated else get_client_ip(request)
                logger.warning(f"Rate limit exceeded for {endpoint_type} by {user_info}")
                return rate_limit_response(endpoint_type, remaining, reset_time)

            # Add rate limit headers to successful responses
            response = view_func(self, request, *args, **kwargs)

            if hasattr(response, '__setitem__'):
                response['X-RateLimit-Remaining'] = str(remaining)

            return response

        return wrapped_view
    return decorator


class AIRateLimitMixin:
    """
    Mixin class for views that need AI rate limiting.

    Usage:
        class MyView(AIRateLimitMixin, APIView):
            ai_rate_limit_type = 'ai_interpret'
    """

    ai_rate_limit_type = 'ai_default'

    def dispatch(self, request, *args, **kwargs):
        allowed, remaining, reset_time = check_rate_limit(
            request,
            self.ai_rate_limit_type
        )

        if not allowed:
            return rate_limit_response(
                self.ai_rate_limit_type,
                remaining,
                reset_time
            )

        response = super().dispatch(request, *args, **kwargs)

        if hasattr(response, '__setitem__'):
            response['X-RateLimit-Remaining'] = str(remaining)

        return response
