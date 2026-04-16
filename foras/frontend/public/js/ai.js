

const AI = {
  async ask(message) {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    return res.json();
  }
};



async function askAI() {
  const input = document.getElementById("aiInput").value;

  if (!input) return;

  const res = await AI.ask(input);

  document.getElementById("aiResult").innerText = res.reply;
}



(async () => {
  const res = await AI.ask("انا مطور node");
  console.log(res.reply);
})();