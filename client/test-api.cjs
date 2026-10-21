const axios = require('axios');
(async () => {
  try {
    const ts = Date.now();
    const email = "test" + ts + "@test.com";
    const randomMobile = Math.floor(Math.random() * 10000000000).toString();
    await axios.post('http://localhost:5050/api/register', { name: "Test", email, password: "password", mobileNumber: randomMobile });
    const loginRes = await axios.post('http://localhost:5050/api/login', { email, password: "password" });
    const token = loginRes.data.token;
    
    const balRes = await axios.get('http://localhost:5050/api/balances', { headers: { Authorization: "Bearer " + token }});
    console.log("BALANCES:", JSON.stringify(balRes.data));
  } catch (err) {
    if (err.response) {
      console.log("ERROR STATUS:", err.response.status);
      console.log("ERROR DATA:", err.response.data);
    } else {
      console.error("ERROR MESSAGE:", err.message);
    }
  }
})();
