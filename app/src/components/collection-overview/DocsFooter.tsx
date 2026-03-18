import { Fragment } from "react";
import { docsFooter } from "../../data/collectionOverviewData";

const DocsFooter = () => (
  <div className="mt-20 pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row items-center justify-between gap-6">
    <div className="flex items-center gap-4">
      <img
        className="w-12 h-12 rounded-lg object-cover"
        src={docsFooter.image}
        alt={docsFooter.imageAlt}
      />
      <div>
        <h4 className="text-sm font-bold text-on-surface">{docsFooter.title}</h4>
        <p className="text-xs text-on-surface-variant">{docsFooter.subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      {docsFooter.links.map((link, index) => (
        <Fragment key={link}>
          <button className="text-xs font-bold text-primary hover:underline">{link}</button>
          {index < docsFooter.links.length - 1 && <span className="text-outline-variant">|</span>}
        </Fragment>
      ))}
    </div>
  </div>
);

export default DocsFooter;
