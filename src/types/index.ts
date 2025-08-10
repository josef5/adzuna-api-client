export type Job = {
  id: string;
  title: string;
  redirect_url: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  created: string;
  contract_type?: string;
};

export type Tab = "new" | "saved" | "applied" | "archived";
