import type { HomeResponse } from "@guoxue/contracts";

function dateParts(date: string) {
  const [year, month, day] = date.split("-");
  return { year, month: String(Number(month)), day: String(Number(day)) };
}

export function TodayGuide({ data }: { data: HomeResponse }) {
  const date = dateParts(data.date);
  return (
    <section className="today-card" aria-label="今日指引">
      <div className="ink-wash" aria-hidden="true" />
      <header className="brand-row">
        <p className="brand-name">国学老师</p>
        <div className="compact-calendar">
          <p className="gregorian-line">
            {date.year}年{date.month}月{date.day}日 · {data.weekday}
          </p>
          <p className="lunar-line">
            农历 {data.calendar.lunarYear}{data.calendar.lunarMonth}{data.calendar.lunarDay}
            <span aria-hidden="true"> · </span>
            属{data.calendar.zodiac}
            {data.calendar.solarTerm ? (
              <>
                <span aria-hidden="true"> · </span>
                {data.calendar.solarTerm}
              </>
            ) : null}
          </p>
        </div>
      </header>

      <div className="guidance-block">
        <div className="guidance-line">
          <span className="section-seal" aria-hidden="true">引</span>
          <p className="guidance-copy">{data.guidance.text}</p>
        </div>
        <div className="do-dont" aria-label="今日宜忌">
          <div className="advice-row suitable-row">
            <span className="advice-label">宜</span>
            <span>{data.guidance.suitable.join(" · ")}</span>
          </div>
          <span className="advice-divider" aria-hidden="true" />
          <div className="advice-row avoid-row">
            <span className="advice-label">忌</span>
            <span>{data.guidance.avoid.join(" · ")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
