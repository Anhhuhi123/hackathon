import os
import redis.asyncio as redis
from typing import Tuple

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class RateLimitExceeded(Exception):
    def __init__(self, retry_after: int):
        self.retry_after = retry_after

async def check_rate_limit(ip: str, identifier: str) -> None:
    """
    Checks if the given IP and identifier combination has exceeded
    5 attempts in the last 15 minutes.
    Raises RateLimitExceeded if limit is reached.
    """
    # Contract: 5 attempts per 15 minutes
    limit = 5
    window_seconds = 15 * 60
    
    key = f"rate:login:{ip}:{identifier}"
    
    # We can use a simple counter with expiration for this
    current_count = await redis_client.get(key)
    
    if current_count and int(current_count) >= limit:
        ttl = await redis_client.ttl(key)
        retry_after = ttl if ttl > 0 else window_seconds
        raise RateLimitExceeded(retry_after=retry_after)

async def increment_rate_limit(ip: str, identifier: str) -> None:
    """Increments the failed attempt counter."""
    window_seconds = 15 * 60
    key = f"rate:login:{ip}:{identifier}"
    
    # Increment and set expire if it's the first time
    async with redis_client.pipeline() as pipe:
        await pipe.incr(key)
        # We only want to set expiration on the first increment or if it doesn't have one
        # but to keep it simple and atomic-ish, we can just check if ttl is -1
        await pipe.execute()
        
    ttl = await redis_client.ttl(key)
    if ttl == -1:
        await redis_client.expire(key, window_seconds)

async def reset_rate_limit(ip: str, identifier: str) -> None:
    """Resets the rate limit counter on successful login."""
    key = f"rate:login:{ip}:{identifier}"
    await redis_client.delete(key)
