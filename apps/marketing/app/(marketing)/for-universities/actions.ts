"use server";

const API_URL = process.env.API_URL || "http://localhost:8080";

export interface DemoRequestState {
  success: boolean;
  error?: string;
}

export async function submitDemoRequest(
  _prevState: DemoRequestState,
  formData: FormData
): Promise<DemoRequestState> {
  const data = {
    institution: formData.get("institution") as string,
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    studentCount: formData.get("studentCount") as string,
    message: formData.get("message") as string,
  };

  // Validate required fields
  if (!data.institution || !data.name || !data.email) {
    return { success: false, error: "Please fill in all required fields." };
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/demo-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error. Please try again later." };
  }
}
