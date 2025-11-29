import "dotenv/config"
import express from "express"
import cors from "cors"
import OpenAI from "openai"

const app = express()
app.use(cors())
app.use(express.json({ limit: "20mb" }))

app.get("/health", (req, res) => {
  res.json({ ok: true })
})

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.post("/analyze-spot", async (req, res) => {
  try {
    const { image } = req.body

    if (!image) {
      return res.status(400).json({ error: "Missing base64 image" })
    }

    const prompt =
      "You analyze photos of cars. Respond with ONLY raw JSON, no code fences, no prose. " +
      "Use this exact shape: " +
      "{ \"isVehicle\": boolean, " +
      "\"vehicleType\": string | null, " +
      "\"brand\": string | null, " +
      "\"modelGuess\": string | null, " +
      "\"modLevel\": \"stock\" | \"light\" | \"heavy\", " +
      "\"tags\": string[] }. " +
      "Rules: " +
      "1) If there is any kind of car or vehicle (including toy or scale model), set isVehicle=true and vehicleType like \"car\", \"truck\", \"motorcycle\". " +
      "2) If you can identify the brand, set brand to that name, for example \"Nissan\", \"Toyota\", \"BMW\". If unsure, use null. " +
      "3) If you see a specific model, put a best guess in modelGuess, for example \"Skyline GT-R R34\". If not clear, use null. " +
      "4) modLevel: \"stock\" if it looks factory, \"light\" if there are a few visible mods, \"heavy\" if it looks strongly modified. " +
      "5) tags must be a compact list of strings that always includes brand and model words when you set them. " +
      "   For example: [\"Nissan\", \"Skyline\", \"R34\", \"JDM\", \"blue stripes\", \"rear wing\"]. " +
      "6) If no vehicle is visible, set isVehicle=false, vehicleType=null, brand=null, modelGuess=null and tags can describe the scene."

    const response = await client.responses.create({
      model: "gpt-4.1",
      temperature: 0.3,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${image}`
            }
          ]
        }
      ]
    })

    const outputItem = response.output?.[0]
    const contentItem = outputItem?.content?.[0]

    if (!contentItem || contentItem.type !== "output_text") {
      console.error("Unexpected output format:", response)
      return res.status(500).json({
        error: "Unexpected model output format"
      })
    }

    let rawText = contentItem.text.trim()
    console.log("RAW MODEL TEXT:", rawText)

    // strip ```json ... ``` if the model still adds it
    if (rawText.startsWith("```")) {
      const lines = rawText.split("\n")
      if (lines[0].startsWith("```")) lines.shift()
      const last = lines[lines.length - 1].trim()
      if (last.startsWith("```")) lines.pop()
      rawText = lines.join("\n").trim()
    }

    let parsed
    try {
      parsed = JSON.parse(rawText)
    } catch (err) {
      console.error("JSON PARSE ERROR:", err)
      return res.status(500).json({
        error: "Bad JSON from model",
        raw: rawText
      })
    }

    if (!Array.isArray(parsed.tags)) {
      parsed.tags = []
    }

    console.log("FINAL JSON:", parsed)
    res.json(parsed)
  } catch (err) {
    console.error("SERVER ERROR:", err)
    const msg =
      err?.error?.message ||
      err?.message ||
      "Server failure"

    res.status(500).json({ error: msg })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log("Spot backend running on port", PORT)
})