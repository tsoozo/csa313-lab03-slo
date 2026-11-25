// Алхам 6: ЗОРИУД FAIL хувилбар. /report-ын босгыг p(95)<100 болгосон (сервер 200ms-ээс хурдан хариулдаггүй)
// Босго бүр README-ийн SLO хүснэгттэй ИЖИЛ байна.
// Хэвийн ажиллуулалт: k6 run slo-test.js            (1 минут)
// Chaos ажиллуулалт:   k6 run -e DURATION=2m slo-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: __ENV.DURATION || '1m',
  thresholds: {
    // Сценарио 1, Performance: /cart/add p95 < 10ms, p99 < 25ms
    'http_req_duration{name:cart}':   ['p(95)<10', 'p(99)<25'],
    // Сценарио 4, ЗОРИУД ЭВДСЭН: /report p95 < 100ms (жинхэнэ SLO нь 450ms)
    'http_req_duration{name:report}': ['p(95)<100'],
    // Сценарио 2, Reliability: /pay error rate < 8% (POFOD < 0.08)
    'http_req_failed{name:pay}':      ['rate<0.08'],
    // Сценарио 3, Availability: бүх хүсэлтийн амжилтын хувь > 90%
    'checks':                         ['rate>0.90'],
  },
};

export default function () {
  const base = 'http://localhost:3000';
  // Endpoint бүрийг name tag-аар ялгаж, threshold-ыг tag тус бүрд тавьсан
  const c = http.post(`${base}/cart/add`, null, { tags: { name: 'cart' } });
  const r = http.get(`${base}/report`, { tags: { name: 'report' } });
  const p = http.post(`${base}/pay`, null, { tags: { name: 'pay' } });
  check(c, { 'cart 200': (x) => x.status === 200 });
  check(r, { 'report 200': (x) => x.status === 200 });
  check(p, { 'pay 200': (x) => x.status === 200 });
  sleep(1); // think time
}
