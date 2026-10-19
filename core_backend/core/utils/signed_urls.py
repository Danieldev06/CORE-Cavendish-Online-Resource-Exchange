"""
Signed URL utilities for secure file access.
Generates and validates time-limited signatures for file access.
"""
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings


class FileAccessSigner:
    """Handles signing and verification of file access URLs."""
    
    def __init__(self, salt: str = "file-access"):
        self.signer = TimestampSigner(salt=salt)
    
    def generate_signed_url(self, resource_id: int, action: str = "view", expires_in: int = 3600) -> str:
        """
        Generate a signed URL for file access.
        
        Args:
            resource_id: ID of the resource
            action: 'view' (inline) or 'download' (attachment)
            expires_in: Expiry time in seconds (default 1 hour)
            
        Returns:
            Signed URL string
        """
        if action not in ('view', 'download'):
            raise ValueError("Action must be 'view' or 'download'")
        
        payload = f"{resource_id}:{action}"
        signed = self.signer.sign(payload)
        
        # Build URL with signature and action (use /signed-file/ endpoint)
        base_url = f"/api/resources/{resource_id}/signed-file/"
        return f"{base_url}?sig={signed}&action={action}"
    
    def verify_signed_url(self, resource_id: int, sig: str, action: str, max_age: int = 3600) -> bool:
        """
        Verify a signed URL signature.
        
        Args:
            resource_id: Resource ID from URL
            sig: Signature from query param
            action: Action from query param (view/download)
            max_age: Max age in seconds
            
        Returns:
            True if valid, False otherwise
        """
        try:
            payload = self.signer.unsign(sig, max_age=max_age)
            payload_resource_id, payload_action = payload.split(':')
            
            return (int(payload_resource_id) == resource_id and 
                    payload_action == action)
        except (BadSignature, SignatureExpired, ValueError):
            return False


# Global instance
file_access_signer = FileAccessSigner()


def generate_file_access_url(resource_id: int, action: str = "view", expires_in: int = 3600) -> str:
    """Convenience function to generate file access URL."""
    return file_access_signer.generate_signed_url(resource_id, action, expires_in)


def verify_file_access_url(resource_id: int, sig: str, action: str, max_age: int = 3600) -> bool:
    """Convenience function to verify file access URL."""
    return file_access_signer.verify_signed_url(resource_id, sig, action, max_age)