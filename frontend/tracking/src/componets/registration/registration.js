import React, { useState } from "react";

export default function ProvisionESP32() {
  const [logs, setLogs] = useState([]);
  const [mac, setMac] = useState(null);

  const log = (msg) => setLogs((prev) => [...prev, msg]);

  const connectESP32 = async () => {
    try {
      // 1. Request serial port
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      log("✅ Connected to ESP32");

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      const writer = textEncoder.writable.getWriter();

      // 2. Ask ESP32 for its MAC
      await writer.write("GET_MAC\n");
      log("📡 Sent: GET_MAC");

      // 3. Wait for response
      const { value, done } = await reader.read();
      if (done) {
        log("❌ Connection closed");
        return;
      }

      const response = value.trim();
      log(`📥 Received: ${response}`);

      if (response.startsWith("MAC:")) {
        const macAddress = response.replace("MAC:", "").trim();
        setMac(macAddress);

        // 4. Register with Django API
        const res = await fetch("/api/devices/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mac: macAddress })
        });

        if (res.ok) {
          const data = await res.json();
          log(`✅ Registered in Django as ${data.device_id}`);

          // 5. Send assigned device_id back to ESP32
          await writer.write(`SET_ID ${data.device_id}\n`);
          log(`📡 Sent: SET_ID ${data.device_id}`);
        } else {
          log("❌ Failed to register in Django");
        }
      }
    } catch (err) {
      log(`⚠️ Error: ${err.message}`);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded-xl">
      <h2 className="text-xl font-bold mb-3">ESP32 Provisioning</h2>
      <button
        onClick={connectESP32}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Connect ESP32
      </button>

      {mac && <p className="mt-2">🆔 MAC: {mac}</p>}

      <div className="mt-4 bg-black text-green-400 p-2 rounded-lg h-40 overflow-y-auto">
        {logs.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
