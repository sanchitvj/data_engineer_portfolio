import json

import logging
import asyncio
import aioboto3
from typing import Dict, Any

# Set up logging
logger = logging.getLogger(__name__)

async def call_claude_async(
    prompt: str,
    model_id: str = "anthropic.claude-3-5-haiku-20241022-v1:0",
    max_tokens: int = 1500,
    region_name: str = "us-east-1",
    extract_json: bool = False
) -> Dict[str, Any]:
    """
    Generic async function to call Claude LLM via Amazon Bedrock.
    
    Args:
        prompt (str): The prompt to send to the LLM
        model_id (str, optional): Bedrock model ID
        max_tokens (int, optional): Maximum number of tokens in response
        region_name (str, optional): AWS region name
        extract_json (bool, optional): Whether to extract JSON from response
        
    Returns:
        Dict[str, Any]: The LLM response or extracted JSON
    """
    try:
        # Get async session and client
        session = aioboto3.Session()
        async with session.client(
            service_name='bedrock-runtime',
            region_name=region_name
        ) as bedrock_runtime:
            # Call Claude via Bedrock
            response = await bedrock_runtime.invoke_model(
                modelId=model_id,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": max_tokens,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            )
            
            # Parse the response
            response_body = json.loads(await response['body'].read())
            content = response_body.get('content', [{}])[0].get('text', '')
            
            # Return raw response if not extracting JSON
            if not extract_json:
                return {"raw_response": content}
                
            # Extract JSON from the response if requested
            try:
                # Look for JSON within the response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_content = content[json_start:json_end]
                    result = json.loads(json_content)
                    return result
                else:
                    logger.warning("No JSON found in LLM response")
                    return {"error": "No JSON found in response", "raw_response": content}
            except json.JSONDecodeError as json_error:
                logger.warning(f"JSON decode error: {str(json_error)}")
                return {"error": "Invalid JSON in response", "raw_response": content}
                
    except Exception as e:
        logger.error(f"Error calling LLM: {str(e)}")
        return {"error": str(e)}

# Synchronous version for compatibility
def call_claude(
    prompt: str,
    model_id: str,
    max_tokens: int = 1500,
    region_name: str = "us-east-1",
    extract_json: bool = False
) -> Dict[str, Any]:
    """
    Synchronous wrapper for call_claude_async.
    
    Parameters and return value are the same as call_claude_async.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        # If there is no event loop, create one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    return loop.run_until_complete(
        call_claude_async(
            prompt=prompt,
            model_id=model_id,
            max_tokens=max_tokens,
            region_name=region_name,
            extract_json=extract_json
        )
    ) 