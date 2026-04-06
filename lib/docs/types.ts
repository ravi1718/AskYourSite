export interface NavItem {
  label: string;
  slug: string;
  section: string;
  badge?: "new" | "coming-soon" | "beta";
}

export interface NavSection {
  title: string;
  icon: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export interface DocMeta {
  title: string;
  description: string;
  section: string;
  slug: string;
  badge?: string;
}

export interface LoadedDoc {
  meta: DocMeta;
  content: string;
}
