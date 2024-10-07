The following has been tested on a Macbook M2 pro:

Following [instruction](https://istio.io/latest/docs/setup/getting-started/#download) to download Istio 1.23.0 which includes the `istioctl` CLI.
To standup the environment:

```
./setup-env.sh
```

1. Follow the `steps` file in `/simple` folder for simple plain text, up to the line that says "Label the namespace".

2. Follow the `steps` file in `/manual-mtls` folder for doing mTLS the hard way.

3. Follow the `steps` file in `/simple` folder for simple plain text, from the line that says "Label the namespace" to do mtls the simple way!
   
To tear down the environment:

```
./teardown.sh
```

# Walkthrough 

## No mTLS

1. Apply the server and client deployments:

```shell
kubectl apply -f server.yaml
kubectl apply -f client.yaml
```

2. Send some traffic from the client to the server:
```shell
kubectl exec deploy/client -c client -- curl -s "http://server:3000/" -v
```


## Manual mTLS

The `server.key` is generated with the `hello` passphrase:
```shell 
openssl genpkey -out server.key -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -aes-128-cbc
```

The CSR `server.csr` is generated with `openssl`. Make sure to use `mtls-server` for the CN to match the hostname of the deployed server:
```shell
openssl req -new  -key server.key -out server.csr
```

Then the self signed server cert `server.cert` is requested:
```shell
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

The client key `client.key` is generated with:
```shell
openssl genpkey -out client.key -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -aes-128-cbc
```

The CSR `client.csr` is generated with no password:
```shell
openssl req -new -key client.key -out client.csr
```

Then the self signed client cert `client.cert` is requested:
```shell
openssl x509 -req -days 365 -in client.csr -signkey client.key -out client.crt
```

1. View the CSR 
```shell
openssl req -in server/server.csr -noout -text
```

2. Step through the server cert
```shell
cat server/server.crt | step certificate inspect -
```

3. View the server code:
```shell
cat server/Server.js
```

4. Apply the client and server deployments:
```shell 
kubectl apply -f mtls-server.yaml
kubectl apply -f mtls-client.yaml
``` 

5. Send traffic, first attempt a request with no cert:
```shell
kubectl exec deploy/mtls-client -c mtls-client -- curl -i https://mtls-server:3000 
```

Then send traffic with the correct certs:

```shell
kubectl exec deploy/mtls-client -c mtls-client -- curl -i https://mtls-server:3000 --cacert server.crt --cert client.crt --key client.key --pass hello
```


## mTLS the "easy" way

1. Label the namespace for ambient:

```shell
kubectl label namespace default istio.io/dataplane-mode=ambient
```

2. Send traffic with http:

```shell
for i in {2..1000}
do
  kubectl exec deploy/client -c client -- curl -s "http://server:3000/"
  sleep 0.1
done
```

## View in prometheus 

View the `istio_tcp_received_bytes_total`:

```shell 
istioctl dashboard prometheus -n monitoring 
```


## View in Kiali 

View the "traffic graph" in Kiali and enable the  security badges display:

```shell
istioctl dashboard kiali -n monitoring 
```

## Policy 

1. Apply deny-all policy. This is in `istio-system` so it will apply to the whole mesh.
```shell
kubectl apply -f policy/deny-all.yaml
```

Now the traffic from the client to the server should be denied at L4:
```shell 
kubectl exec deploy/client -c client -- curl -s "http://server:3000/" -v
```

2. Only grant permissions based on zero trust principals (only grant access to apps that need it)
```shell
kubectl apply -f policy/client-to-server-l4.yaml
```

Now the traffic from the client to the server should work again:
```shell 
kubectl exec deploy/client -c client -- curl -s "http://server:3000/" -v
```
