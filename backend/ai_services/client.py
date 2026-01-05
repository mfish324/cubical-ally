"""
Anthropic Claude API client wrapper.
"""
import json
import logging
from typing import Dict, List, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


class ClaudeClient:
    """Wrapper for Anthropic Claude API calls."""

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.ANTHROPIC_MODEL
        self._client = None

    @property
    def client(self):
        """Lazy initialization of Anthropic client."""
        if self._client is None:
            try:
                import anthropic
                self._client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError(
                    "anthropic package is required. Install with: pip install anthropic"
                )
        return self._client

    def chat(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
    ) -> Dict:
        """
        Send a chat message to Claude and return the response.

        Returns:
            Dict with 'content', 'tokens_input', 'tokens_output'
        """
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured")

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            return {
                'content': response.content[0].text,
                'tokens_input': response.usage.input_tokens,
                'tokens_output': response.usage.output_tokens,
            }

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise

    def chat_json(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int = 2000,
        temperature: float = 0.5,
    ) -> Dict:
        """
        Send a chat message expecting JSON response.

        Returns:
            Dict with parsed JSON 'data', 'tokens_input', 'tokens_output'
        """
        result = self.chat(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        # Parse JSON from response
        content = result['content'].strip()

        # Handle potential markdown code blocks
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]

        try:
            data = json.loads(content.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {content[:500]}")
            raise ValueError(f"Invalid JSON response from AI: {e}")

        return {
            'data': data,
            'tokens_input': result['tokens_input'],
            'tokens_output': result['tokens_output'],
        }


# Singleton instance
claude_client = ClaudeClient()
