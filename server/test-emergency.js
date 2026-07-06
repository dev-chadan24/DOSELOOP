async function test() {
  try {
    console.log("Calling emergency GET...");
    const res = await fetch('http://localhost:5000/api/v1/emergency', {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
