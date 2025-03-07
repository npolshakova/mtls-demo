1. Build the server image with your image name (example `nina-server`):

```shell
docker build . -t nina-server
```

2. Tag the image with your tag (example `no-mtls`):

```shell
docker tag nina-server:latest docker.io/npolshak/nina-server:no-mtls
```

For the client image, we will use the base `curlimages/curl` without any modifications.