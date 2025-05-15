export default async function handler(req, res) {
  if (req.method === "POST") {
    const response = await fetch(
      "https://script.google.com/macros/s/AKfycbzwGd4UAuD1Z_96dYdm6uDtROu_zW1xvYGn41lCcAmGLbfeS9yPI2y_uxkAQmq60zUQpw/exec?action=batchUpdateKiemHang",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      }
    );

    const result = await response.text();
    return res.status(200).send(result);
  }

  res.status(405).send("Method Not Allowed");
}
