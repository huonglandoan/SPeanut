import {useState} from 'react'
import styles from '../styles/Calendar.module.css'
import {ChevronLeft, ChevronRight} from "lucide-react";

interface CalendarViewProps {
  year: number;
  setYear: React.Dispatch<React.SetStateAction<number>>;
  month: number;
  setMonth: React.Dispatch<React.SetStateAction<number>>;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
}

interface DayInfo{
  day: number,
  month: number,
  year: number,
  isCurrentMonth: boolean
}
interface CalEvent{
  id: number,
  title: string,
  subtitle: string,
  time: string,
  color: string, 
  hasViewMore?: boolean
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_DOTS: Record<string, string[]> = {
  "2021-09-01": ["#735BF2"],
  "2021-09-02": ["#00B383", "#0095FF", "#735BF2"],
  "2021-09-03": ["#735BF2", "#0095FF"],
  "2021-09-06": ["#735BF2", "#00B383"],
  "2021-09-08": ["#735BF2"],
  "2021-09-10": ["#735BF2", "#0095FF", "#00B383"],
  "2021-09-13": ["#735BF2", "#0095FF"],
  "2021-09-15": ["#735BF2", "#00B383"],
  "2021-09-17": ["#735BF2"],
  "2021-09-20": ["#735BF2", "#00B383"],
  "2021-09-22": ["#735BF2", "#0095FF", "#00B383"],
  "2021-09-23": ["#735BF2"],
  "2021-09-29": ["#735BF2", "#0095FF", "#00B383"],
  "2021-09-30": ["#735BF2", "#0095FF"],
};

const EVENTS: CalEvent[] = [
  {
    id: 1,
    title: "Design new UX flow for Michael",
    subtitle: "Start from screen 16",
    time: "10:00–13:00",
    color: "#00B383",
  },
  {
    id: 2,
    title: "Brainstorm with the team",
    subtitle: "Define the problem or question that the brainstorming session will aim to address.",
    time: "14:00–15:00",
    color: "#735BF2",
    hasViewMore: true,
  },
  {
    id: 3,
    title: "Workout with Ella",
    subtitle: "We will do the legs and back workout",
    time: "19:00–20:00",
    color: "#0095FF",
  },
];

function buildCalendar(year: number, month: number): DayInfo[]{
  const first = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevLastDay = new Date(year, month - 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7; // Mon = 0

  const res : DayInfo[] =  []
  const pm = month === 1 ? 12 : month - 1
  const py = month === 1 ? year - 1 : year

  for (let i = offset - 1; i >= 0; --i)
    res.push({day: prevLastDay - i, month: pm, year: py, isCurrentMonth: false})

  for (let d = 1; d <= daysInMonth; d++)
    res.push({ day: d, month, year, isCurrentMonth: true })

  const nm = month === 12 ? 1 : month + 1
  const ny = month === 12 ? year + 1 : year
  let nd = 1;
  while (res.length < 35)
    res.push({ day: nd++, month: nm, year: ny, isCurrentMonth: false })

  return res
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function EventCard({ ev }: { ev: CalEvent }) {
  return (
    <article className={styles.eventCard}>
      <div className={styles.cardTop}>
         <div className={styles.actionGroup}></div>
        <div className={styles.cardLeft}>
          <span
            className={styles.cardDot}
            style={{ backgroundColor: ev.color }}
          />
          <span className={styles.cardTime}>{ev.time}</span>
        </div>
        <button className={styles.menuBtn} aria-label="More options">
          <span className={styles.menuDot} />
          <span className={styles.menuDot} />
          <span className={styles.menuDot} />
        </button>
      </div>

      <h3 className={styles.cardTitle}>{ev.title}</h3>

      {ev.hasViewMore ? (
        <p className={styles.cardSub}>
          Define the problem or question that…{" "}
          <button className={styles.viewMore}>View more</button>
        </p>
      ) : (
        <p className={styles.cardSub}>{ev.subtitle}</p>
      )}
    </article>
  );
}

export default function CalendarView({ year= new Date().getFullYear(), setYear, month = new Date().getMonth() + 1, setMonth, selected = new Date().getDate(), setSelected }: any){
    
    const days = buildCalendar(year, month);

 function prevMonth() {
    // 1. Tính toán tháng mới và năm mới trước
    let targetMonth = month - 1;
    let targetYear = year;
    
    if (month === 1) {
      targetMonth = 12;
      targetYear = year - 1;
      setYear((y: number) => y - 1);
    }
    setMonth(targetMonth);
    const maxDaysInNewMonth = new Date(targetYear, targetMonth, 0).getDate();
    if (selected > maxDaysInNewMonth) {
      setSelected(maxDaysInNewMonth);
    }
  }

  function nextMonth() {
    let targetMonth = month + 1;
    let targetYear = year;

    if (month === 12) {
      targetMonth = 1;
      targetYear = year + 1;
      setYear((y: number) => y + 1);
    }
    setMonth(targetMonth);

    const maxDaysInNewMonth = new Date(targetYear, targetMonth, 0).getDate();

    if (selected > maxDaysInNewMonth) {
      setSelected(maxDaysInNewMonth);
    }
  }

  return (
    <div className={styles.mainContent}>
      <section className={styles.calendarShell}>
        <div className={styles.monthHeader}>
          <button
            className={styles.iconBtn}
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>

          <div className={styles.monthLabel}>
            <p className={styles.monthName}>{MONTHS[month - 1]}</p>
            <p className={styles.monthYear}>{year}</p>
          </div>

          <button
            className={styles.iconBtn}
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>

        <div className={styles.weekdays}>
          {WEEKDAYS.map((d) => (
            <div key={d} className={styles.weekday}>{d}</div>
          ))}
        </div>

        <div className={styles.calGrid}>
          {days.map((d, idx) => {
            const key = dateKey(d.year, d.month, d.day);
            const dots = EVENT_DOTS[key] || [];
            const isSel = d.isCurrentMonth && d.day === selected && d.month === month;

            const cellClass = [
              styles.dayCell,
              !d.isCurrentMonth ? styles.otherMonth : "",
            ].filter(Boolean).join(" ");

            const numClass = [
              styles.dayNumber,
              isSel ? styles.selected : "",
              !d.isCurrentMonth ? styles.otherDay : "",
            ].filter(Boolean).join(" ");
            
            return (
              <div
                key={idx}
                className={cellClass}
                onClick={() => d.isCurrentMonth && setSelected(d.day)}
                role={d.isCurrentMonth ? "button" : undefined}
                tabIndex={d.isCurrentMonth ? 0 : undefined}
                aria-label={d.isCurrentMonth ? `${d.day} ${MONTHS[month - 1]}` : undefined}
                onKeyDown={(e) => {
                  if (d.isCurrentMonth && (e.key === "Enter" || e.key === " "))
                    setSelected(d.day);
                }}
              >
                <span className={numClass}>{d.day}</span>

                <div className={styles.dotsRow}>
                  {dots.slice(0, 3).map((color, i) => (
                    <span
                      key={i}
                      className={styles.dot}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.dragWrap}>
          <div className={styles.dragPill} />
        </div>
      </section>

      <aside className={styles.eventPanel}>
        <div className={styles.eventList}>
          {EVENTS.map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
      </aside>
    </div>
  );
}