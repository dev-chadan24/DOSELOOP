async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/health');
    console.log(res.status, await res.text());
  } catch (e) {
    console.error(e);
  }
}
test();
