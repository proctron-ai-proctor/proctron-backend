@echo off

docker cp kms:tmp/. E:\dev\proctron_project\proctron-backend\vids
docker exec -d kms ./rm_recorded_videos.sh