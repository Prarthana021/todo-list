INSTANCE_NAME="cisc5550-21"
MACHINE_TYPE="e2-medium"
IMAGE_FAMILY="debian-11"
IMAGE_PROJECT="debian-cloud"
ZONE="us-central1-a"

# Create VM instance
gcloud compute instances create $INSTANCE_NAME \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --zone=$ZONE
