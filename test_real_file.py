import requests
import os
import json
import time

def test_with_real_file():
    """
    Test the API with the real binary file
    """
    # Path to the real binary file
    file_path = r"G:\Shared drives\DATA-TOTO\TOTO_BioTCloud\Staging Env Database Backup Oct2023 to Mar2025\bin files\20231027_1700_62e53f34-e560-457d-b373-17c46de7890e.bin"
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return
    
    # Read binary data from file
    with open(file_path, 'rb') as file:
        file_data = file.read()
    
    file_size = len(file_data)
    print(f"File size: {file_size} bytes")
    
    # API Gateway endpoint URL
    api_url = "https://gdtylrq5q2.execute-api.us-east-1.amazonaws.com/prod/process"
    
    print(f"Sending file data to API Gateway...")
    start_time = time.time()
    
    try:
        # Send POST request with binary data
        response = requests.post(
            api_url,
            data=file_data,
            headers={"Content-Type": "application/octet-stream"},
            timeout=60  # Increased timeout to 60 seconds
        )
        
        elapsed_time = time.time() - start_time
        
        # Print response information
        print(f"Request completed in {elapsed_time:.2f} seconds")
        print(f"Status code: {response.status_code}")
        print(f"Response text: {response.text[:500]}...")  # Show only first 500 chars if response is long
        
        # If successful, pretty print the JSON response
        if response.status_code == 200:
            try:
                print("\nFormatted response:")
                response_json = response.json()
                # Save full response to file
                with open("api_response.json", "w") as f:
                    json.dump(response_json, f, indent=2)
                print(json.dumps(response_json, indent=2))
                print("\nFull response saved to api_response.json")
            except:
                print("Could not parse response as JSON")
                
    except requests.exceptions.Timeout:
        elapsed_time = time.time() - start_time
        print(f"Request timed out after {elapsed_time:.2f} seconds")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_with_real_file() 