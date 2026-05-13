const axios = require("axios");
const logger = require("../config/logger");
require("dotenv").config();

async function callLLM(prompt) {
    try {
        logger.info("📡 Calling OpenAI API for structured resume data", { prompt });

        // Send the request to OpenAI API with the generated prompt
        const response = await axios.post(process.env.LLM_URL, {
            model: process.env.MODEL_NAME,
            stream: false,
            messages: [{
                role: "user",
                content: prompt
            }],
            response_format: {
                type: "json_schema",
                json_schema: {
                    "name": "resume",
                    "strict": true,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string"
                            },
                            "professional_profile": {
                                "type": "string"
                            },
                            "skills": {
                                "type": "object"
                            },
                            "experience": {
                                "type": "array",
                                "items": [
                                    {
                                        "type": "object",
                                        "properties": {
                                            "job_title": {
                                                "type": "string"
                                            },
                                            "company": {
                                                "type": "string"
                                            },
                                            "start_date": {
                                                "type": "string"
                                            },
                                            "end_date": {
                                                "type": "string"
                                            },
                                            "achievements": {
                                                "type": "array",
                                                "items": [
                                                    {
                                                        "type": "object",
                                                        "properties": {
                                                            "situation": {
                                                                "type": "string"
                                                            },
                                                            "task": {
                                                                "type": "string"
                                                            },
                                                            "action": {
                                                                "type": "string"
                                                            },
                                                            "result": {
                                                                "type": "string"
                                                            }
                                                        },
                                                        "required": [
                                                            "situation",
                                                            "task",
                                                            "action",
                                                            "result"
                                                        ]
                                                    }
                                                ]
                                            }
                                        },
                                        "required": [
                                            "job_title",
                                            "company",
                                            "start_date",
                                            "end_date",
                                            "achievements"
                                        ]
                                    }
                                ]
                            },
                            "education": {
                                "type": "array",
                                "items": [
                                    {
                                        "type": "object",
                                        "properties": {
                                            "degree": {
                                                "type": "string"
                                            },
                                            "institution": {
                                                "type": "string"
                                            },
                                            "location": {
                                                "type": "string"
                                            },
                                            "graduation_date": {
                                                "type": "string"
                                            }
                                        },
                                        "required": [
                                            "degree",
                                            "institution",
                                            "location",
                                            "graduation_date"
                                        ]
                                    }
                                ]
                            }
                        },
                        "required": [
                            "name",
                            "professional_profile",
                            "skills",
                            "experience",
                            "education"
                        ]
                    }
                },
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                ...(process.env.OPENAI_API_KEY ? { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` } : {})
            }
        });

        logger.info("📡 OpenAI API Raw Response:", response.data);

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0] && response.data.choices[0].message && response.data.choices[0].message.content) {
            return response.data.choices[0].message.content;
        }

        throw new Error("Could not get message content from LLM response");

        return response.data.response;
    } catch (error) {
        logger.error("🔥 OpenAI API Error:", error);
        throw new Error("Failed to get response from OpenAI API.");
    }
}

module.exports = { callLLM };

