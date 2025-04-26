#!/bin/bash
gcloud compute ssh roublenepalgmail.com@instance-20250318-200550 --zone "us-central1-c" --project "cisc5550-454119" --command "cd todolist && sudo python3 todolist.py"