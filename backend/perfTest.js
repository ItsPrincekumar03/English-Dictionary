async function test() {
    const start = Date.now();
    const res = await fetch('http://localhost:5000/api/words/happy');
    const end = Date.now();
    const text = await res.text();
    console.log(`Time: ${end - start}ms`);
    console.log(`Status: ${res.status}`);
    console.log(`Size: ${text.length} bytes`);
}
test();
