import { Battery, CircleAlert, GlassWater, Leaf, Milk, Newspaper, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { guidance } from '../../data/guidance';
import { PageTitle } from '../../components/ui';
const icons = {
  leaf: Leaf,
  bottle: Milk,
  paper: Newspaper,
  glass: GlassWater,
  metal: Wrench,
  battery: Battery,
};
export function Guide() {
  return (
    <>
      <PageTitle
        eyebrow="START WITH THE RIGHT HABIT"
        title="Separate today. Care for tomorrow."
        description="A practical, manual segregation guide — not an AI classifier."
        action={
          <Link to="/resident/pickup" className="btn btn-primary">
            Request a pickup
          </Link>
        }
      />
      <div className="guide-intro">
        <Leaf size={28} />
        <div>
          <h2>Keep each category separate.</h2>
          <p>
            Store waste safely, avoid contamination, and confirm what your collection operator can
            accept. These are general guidelines, not definitive local disposal rules.
          </p>
        </div>
      </div>
      <div className="guide-grid">
        {guidance.map((item) => {
          const Icon = icons[item.icon as keyof typeof icons];
          return (
            <article className="card guide-card" key={item.category}>
              <span className={`category-icon tone-${item.tone}`}>
                <Icon size={25} />
              </span>
              <h2>{item.category}</h2>
              <p className="muted">{item.subtitle}</p>
              <div className="guide-examples">
                <span className="eyebrow">COMMON EXAMPLES</span>
                <p>{item.examples}</p>
              </div>
              <p>{item.advice}</p>
              <div className="guide-caution">
                <CircleAlert size={17} />
                <span>{item.caution}</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="info-note">
        Guidance is configurable in <code>src/data/guidance.ts</code>. Real collection teams,
        authorized handlers and disposal arrangements must exist outside the software.
      </div>
    </>
  );
}
