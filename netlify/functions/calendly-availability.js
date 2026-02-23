exports.handler = async (event) => {
  try {
    const token = process.env.CALENDLY_PAT;
    if (!token) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing CALENDLY_PAT env var" }),
      };
    }

    const qs = event.queryStringParameters || {};
    const eventType = qs.event_type;
    const startTime = qs.start_time;
    const endTime = qs.end_time;

    if (!eventType || !startTime || !endTime) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required params",
          required: ["event_type", "start_time", "end_time"],
        }),
      };
    }

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const calendlyUrl =
      `https://api.calendly.com/event_type_available_times` +
      `?event_type=${encodeURIComponent(eventType)}` +
      `&start_time=${encodeURIComponent(startTime)}` +
      `&end_time=${encodeURIComponent(endTime)}`;

    const res = await fetch(calendlyUrl, { headers });
    const bodyText = await res.text();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Calendly availability failed", detail: bodyText }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", detail: String(err) }),
    };
  }
};
