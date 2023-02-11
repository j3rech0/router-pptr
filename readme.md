Reboot PLDT router using puppeteer. 

- Server only hosts puppeteer 
- Tested on: *PLDT (HG6245D, software version: RP2740)*

Usage:
```
Rename .env-example to .env and modify USER, PASS accordingly.

git clone --recursive https://github.com/j3rech0/router-pptr  -b parcel

# Terminal 1
cd server
yarn
yarn start

# Terminal 2
yarn
yarn start
```

Note:
```
// uncomment 
element.click on `/client/src/rebootrouter.js` file Line: 88
```


Now browse to `http://localhost:1337/`
