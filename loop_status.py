import requests
import time
import datetime

while True:
    print(f"{datetime.datetime.now()} #{requests.get("http://73.162.135.162:5000/get_status").text}")
    time.sleep(0.5)
