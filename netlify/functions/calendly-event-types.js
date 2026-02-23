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

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    // 1) Get current user
    const meRes = await fetch("https://api.calendly.com/users/me", { headers });
    const meText = await meRes.text();
    if (!meRes.ok) {
      return {
        statusCode: meRes.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Calendly users/me failed", detail: meText }),
      };
    }
    const me = JSON.parse(meText);
    const userUri = me?.resource?.uri;

    // 2) List event types for user
    const etRes = await fetch(
      `https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}&active=true&count=100`,
      { headers }
    );
    const etText = await etRes.text();
    if (!etRes.ok) {
      return {
        statusCode: etRes.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Calendly event_types failed", detail: etText }),
      };
    }
    const eventTypes = JSON.parse(etText);

    const onboardingNames = [
  "Onboarding 1 – Quote + Tour",
  "Focus – Product & Catalog",
  "Focus – Templates & Widgets",
  "Final Q&A"
];

const simplified = (eventTypes.collection || [])
  .filter(et => onboardingNames.includes(et.name))
  .map((et) => ({
      name: et.name,
      uri: et.uri,
      scheduling_url: et.scheduling_url,
      duration: et.duration,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: { uri: userUri, timezone: me?.resource?.timezone },
        eventTypes: simplified,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", detail: String(err) }),
    };
  }
};
