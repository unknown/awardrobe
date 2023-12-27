export const Pages = ["Featured", "Following"] as const;

export type Page = (typeof Pages)[number];

export const isPage = (page: any): page is Page => Pages.includes(page as Page);
