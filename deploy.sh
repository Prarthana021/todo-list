
#!/bin/bash


gcloud compute scp todolist.py todolist.db templates/index.html roublenepalgmail.com@instance-20250318-200550:~/todolist --zone=us-central1-c

gcloud compute ssh --zone "us-central1-c" roublenepalgmail.com@instance-20250318-200550 --project "cisc5550-454119" --command "cd todolist && mkdir templates && mv index.html templates"
gcloud compute ssh roublenepalgmail.com@instance-20250318-200550 --zone "us-central1-c" --project "cisc5550-454119" --command "sudo apt install python3-pip && sudo apt install python3-flask"

echo "Files uploaded successfully to VM instance"