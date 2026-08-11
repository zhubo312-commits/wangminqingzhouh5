import { Link } from "react-router-dom";
import { PageHeader } from "../../components/PageHeader";
import { PAIPAN_ITEMS } from "./catalog";

export function PaipanMenuPage() {
  return (
    <main className="app-shell inner-shell min-h-[100dvh]">
      <div className="paper-grain" aria-hidden="true" />
      <div className="inner-page">
        <PageHeader title="专业排盘" backTo="/" backLabel="返回国学首页" />

        <section className="paipan-intro" aria-labelledby="paipan-heading">
          <span className="section-kicker">传统术数</span>
          <div className="paipan-heading-row">
            <h2 id="paipan-heading">选择排盘方式</h2>
            <p>点击图标进入排盘</p>
          </div>
        </section>

        <nav className="paipan-grid" aria-label="排盘方式">
          {PAIPAN_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const content = (
              <>
                <span className={`paipan-icon${index % 2 ? " paipan-icon-cool" : ""}`}>
                  <Icon size={38} weight="light" aria-hidden="true" />
                </span>
                <strong>{item.name}</strong>
                {!item.enabled && <small>即将上线</small>}
              </>
            );

            return item.enabled && item.path ? (
              <Link className="paipan-tile" to={item.path} key={item.name}>
                {content}
              </Link>
            ) : (
              <div
                className="paipan-tile paipan-tile-disabled"
                aria-disabled="true"
                key={item.name}
              >
                {content}
              </div>
            );
          })}
        </nav>

        <p className="culture-notice">传统文化研究与娱乐参考，请理性看待推演结果</p>
      </div>
    </main>
  );
}
