import type { HomeResponse } from "@guoxue/contracts";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const homeData: HomeResponse = {
  date: "2026-08-10",
  weekday: "星期一",
  calendar: {
    lunarYear: "丙午年",
    lunarMonth: "六月",
    lunarDay: "廿八",
    zodiac: "马",
    solarTerm: null,
  },
  guidance: {
    text: "心静则事明，今日宜先理清轻重，再从容行动。",
    suitable: ["静心", "学习"],
    avoid: ["急躁"],
  },
  links: {
    interpretation: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
    learning: "https://learning.example/lead",
    question: "https://gx.yipuwh.com/h6/pages/jiedu/chat?isShowPay=1",
  },
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("homepage", () => {
  it("renders the combined guide and all business entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/v1/home")) {
          return new Response(JSON.stringify(homeData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(null, { status: 204 });
      }),
    );

    render(<App />);

    expect(await screen.findByRole("region", { name: "今日指引" })).toBeVisible();
    expect(screen.getByText("引")).toBeVisible();
    expect(screen.queryByText("今日指引")).not.toBeInTheDocument();
    expect(screen.getByText(/农历 丙午年六月廿八/)).toBeVisible();
    expect(screen.getByRole("link", { name: /专业排盘/ })).toHaveAttribute(
      "href",
      "/paipan",
    );
    expect(screen.getByRole("link", { name: /国心解读/ })).toHaveAttribute(
      "href",
      homeData.links.interpretation,
    );
    expect(screen.getByRole("link", { name: /学习资料/ })).toHaveAttribute(
      "href",
      homeData.links.learning,
    );
    const questionComposer = screen.getByRole("link", { name: /问问题/ });
    expect(questionComposer).toHaveAttribute(
      "href",
      homeData.links.question,
    );
    expect(questionComposer).toHaveClass("question-composer");
    expect(screen.getByText("有什么问题，问问国学老师…")).toBeVisible();
    questionComposer.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(questionComposer);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/events",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ event: "question_click" }),
        }),
      ),
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/v1/events", expect.anything()));
  });

  it("shows exactly eleven chart entries and enables 生平子时、遁甲学与决策学", async () => {
    window.history.pushState({}, "", "/paipan");
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "排盘方式" });
    expect(navigation.children).toHaveLength(11);
    expect(screen.getByRole("link", { name: "生平子时" })).toHaveAttribute(
      "href",
      "/paipan/shengping-zishi",
    );
    expect(screen.getByRole("link", { name: "遁甲学" })).toHaveAttribute(
      "href",
      "/paipan/dunjia",
    );
    expect(screen.getByRole("link", { name: "决策学" })).toHaveAttribute(
      "href",
      "/paipan/juece",
    );
    expect(navigation.querySelectorAll('[aria-disabled="true"]')).toHaveLength(8);
    expect(screen.getAllByText("即将上线")).toHaveLength(8);
  });

  it("registers the decision route in the normal build", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/api/v1/home")) {
          return new Response(JSON.stringify(homeData), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (String(input).endsWith("/api/v1/paipan/areas")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(null, { status: 204 });
      }),
    );
    window.history.pushState({}, "", "/paipan/juece");

    render(<App />);

    expect(await screen.findByText("起盘条件")).toBeVisible();
    expect(window.location.pathname).toBe("/paipan/juece");
  });

  it("shows a recoverable error instead of a blank page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/api/v1/home")) {
          return new Response(JSON.stringify({ detail: "日历数据尚未导入" }), {
            status: 503,
            headers: { "Content-Type": "application/problem+json" },
          });
        }
        return new Response(null, { status: 204 });
      }),
    );

    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("日历数据尚未导入");
    expect(screen.getByRole("button", { name: "重新加载" })).toBeVisible();
  });
});
