import sys
import requests
import json
import time

args = sys.argv[1:]
filename = args[0]

with open(filename, "r") as opened_file:
	coordinates = []
	for line in opened_file:
		ip = line.strip()
		url = "http://ip-api.com/json/" + ip
		try:
			r = requests.get(url=url)
			data = r.json()
			coordinates.append((data["lat"], data["lon"]))
			time.sleep(2)
		except:
			time.sleep(1)

	for coordinate in coordinates:
		print(coordinate)


