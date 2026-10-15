import PhaseIntro from './PhaseIntro'

export default {
  title: 'Components/PhaseIntro',
  component: PhaseIntro,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    title: { control: 'text' },
    headline: { control: 'text' },
    desc: { control: 'text' },
    breakpoint: { control: 'select', options: ['desktop', 'tablet', 'mobile'] },
  },
  args: {
    title: 'EMPATHIZE',
    headline: 'Why do ticket scams cluster on X(Twitter), and why do people still trade on X(Twitter)?',
    desc: "왜 티켓 사기는 X(트위터)에 몰리고 사람들은 그런데도 왜 X(트위터)에서 거래할까?",
    breakpoint: 'desktop',
  },
}

export const Desktop = {}
export const Tablet = { args: { breakpoint: 'tablet' } }
export const Mobile = { args: { breakpoint: 'mobile' } }
