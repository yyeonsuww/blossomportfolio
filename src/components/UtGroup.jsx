import SectionIntro from './SectionIntro'
import '../componentsStyle/ut-group.css'

export default function UtGroup({
  photos = [],
  docs = [],
  eyebrow = 'USABILITY TEST',
  title = '구매자 신뢰와 판매자 편의성 검증',
  description = '마지막으로 확인하고 싶었던 건 화면이 작동하는지가 아니라 구매자가 실제로 안심을 느끼는지와 판매자는 판매 흐름이 쉽고 자연스러운지 여부였습니다. 그래서 4명의 사용자에게 과업을 주고 따로 관찰하는 사용성 테스트를 진행했습니다.',
  resultText = '테스트 결과, 구매자는 AI 검증과 안전결제를 통해 거래에 대한 신뢰를 느꼈으며 에스크로 구조도 별도 설명 없이도 쉽게 이해했습니다. 판매자는 복잡한 절차 없이 간편하게 등록할 수 있다는 점에서 긍정적인 반응을 보였습니다. SUS 점수 또한 평균 86.3점으로 우수한 사용성 평가를 받았습니다.',
  docCaption1 = 'UT QUESTIONS & TASKS',
  docCaption2 = 'SUS 점수',
}) {
  const [photo1, photo2] = photos
  const [doc1, doc2] = docs

  return (
    <section className="ut-group" data-node-id="360:5954">
      <SectionIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
      />

      <div className="ut-group__photos">
        <div className="ut-group__photo">{photo1 ? <img src={photo1} alt="" /> : null}</div>
        <div className="ut-group__photo">{photo2 ? <img src={photo2} alt="" /> : null}</div>
      </div>

      {resultText && <p className="ut-group__result">{resultText}</p>}

      <div className="ut-group__docs">
        <figure className="ut-group__doc ut-group__doc--wide">
          <div className="ut-group__doc-media">{doc1 ? <img src={doc1} alt="" /> : null}</div>
          <figcaption>{docCaption1}</figcaption>
        </figure>
        <figure className="ut-group__doc">
          <div className="ut-group__doc-media">{doc2 ? <img src={doc2} alt="" /> : null}</div>
          <figcaption>{docCaption2}</figcaption>
        </figure>
      </div>
    </section>
  )
}
