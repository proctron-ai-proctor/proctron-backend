proctron-backend
==============

Implemented basic authentication services

Brief description
--------------

All the responses are returned as JSON objects

Available end points
--------------

```sh
/users/register
```

send a POST request with a JSON object containing users's email, name and password

```sh
POST http://localhost:3000/users/register
Content-Type: application/json

{
    "email": "annie@gmail.com", 
    "name": "annabeth",
    "password": "slayer"
}
```

```sh
/users/login
```

send a POST request with a JSON object containing users's email and password

```sh
POST http://localhost:3000/users/login
Content-Type: application/json

{
    "email": "slayer@gmail.com", 
    "password": "slayit"
}
```

Compile
--------------

1. Install dependencies
2. Run 
```sh
npm run devStart
```
