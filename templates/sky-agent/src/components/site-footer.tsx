import Link from "next/link";

import { SkyAgentLogo } from "@/components/icons";
import { footerColumns } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer id="footer" className="w-full pb-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-10 gap-10">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link className="flex items-center gap-2" href="/">
            <SkyAgentLogo className="size-8" />
            <p className="text-xl font-semibold text-primary">SkyAgent</p>
          </Link>
          <p className="tracking-tight text-muted-foreground font-medium">
            AI assistant designed to streamline your digital workflows and
            handle mundane tasks, so you can focus on what truly matters
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1 max-w-2xl">
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-primary">{column.title}</p>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border py-6 px-10 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SkyAgent. All rights reserved.
      </div>
    </footer>
  );
}
