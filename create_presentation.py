import { useState, useCallback } from 'react';
import { slidesData } from './slidesData';
import { generatePresentation } from './generatePptx';
import { coatOfArmsSvg } from './coatOfArms';

function App() {
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generatePresentation();
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    } catch (err) {
      console.error('Error generating presentation:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const currentSlide = slidesData[selectedSlide];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-[#1B3A5C] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-14 flex-shrink-0"
              dangerouslySetInnerHTML={{ __html: coatOfArmsSvg }}
            />
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Министерство здравоохранения Московской области
              </h1>
              <p className="text-sm text-blue-200 mt-0.5">
                Генератор презентации - 15 слайдов
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`
              px-6 py-3 rounded-lg font-bold text-sm transition-all duration-300
              flex items-center gap-2 shadow-lg
              ${isGenerating
                ? 'bg-gray-400 cursor-wait'
                : generated
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-amber-500 hover:bg-amber-600 hover:shadow-xl hover:scale-105'
              }
              text-white
            `}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Генерация...
              </>
            ) : generated ? (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Скачано!
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать PPTX
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 flex gap-6">
        {/* Slide Thumbnails */}
        <aside className="w-56 flex-shrink-0 overflow-y-auto max-h-[calc(100vh-180px)] pr-2 scrollbar-thin">
          <div className="space-y-2">
            {slidesData.map((slide, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlide(idx)}
                className={`
                  w-full text-left p-2 rounded-lg transition-all duration-200 border-2
                  ${selectedSlide === idx
                    ? 'border-[#1B3A5C] bg-white shadow-md scale-[1.02]'
                    : 'border-transparent bg-white/70 hover:bg-white hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <span className={`
                    flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                    ${selectedSlide === idx
                      ? 'bg-[#1B3A5C] text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {slide.number}
                  </span>
                  <span className="text-xs text-gray-700 leading-tight line-clamp-2">
                    {slide.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Slide Preview & Speech */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Slide Preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-1 bg-gray-200 flex items-center gap-1.5 px-3">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-xs text-gray-500 ml-2">
                Слайд {currentSlide.number} / {slidesData.length}
              </span>
            </div>
            <div className="aspect-[16/9] relative overflow-hidden">
              <SlidePreview slide={currentSlide} />
            </div>
          </div>

          {/* Speaker Notes */}
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-5 w-5 text-[#1B3A5C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <h3 className="font-bold text-[#1B3A5C]">Сопроводительная речь</h3>
              <span className="text-xs text-gray-400 ml-auto">~{getEstimatedTime(currentSlide.speech)}</span>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {currentSlide.speech}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setSelectedSlide(Math.max(0, selectedSlide - 1))}
              disabled={selectedSlide === 0}
              className="px-4 py-2 rounded-lg bg-white shadow text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              < Предыдущий
            </button>
            <div className="flex gap-1">
              {slidesData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSlide(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    selectedSlide === idx ? 'bg-[#1B3A5C] scale-125' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setSelectedSlide(Math.min(slidesData.length - 1, selectedSlide + 1))}
              disabled={selectedSlide === slidesData.length - 1}
              className="px-4 py-2 rounded-lg bg-white shadow text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Следующий >
            </button>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="bg-gray-200 border-t border-gray-300 py-3 text-center text-xs text-gray-500">
        Докладчик: Иванов Иван Иванович, Министр здравоохранения Московской области | 2025 г. | Общее время доклада: ~28 мин.
      </footer>
    </div>
  );
}

function getEstimatedTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.round(words / 130); // ~130 words per minute for Russian speech
  if (minutes <= 1) return '~1 мин.';
  return `~${minutes} мин.`;
}

function SlidePreview({ slide }: { slide: typeof slidesData[0] }) {
  if (slide.type === 'title') return <TitleSlidePreview />;
  if (slide.type === 'final') return <FinalSlidePreview />;
  return <ContentSlidePreview slide={slide} />;
}

function TitleSlidePreview() {
  return (
    <div className="w-full h-full bg-[#1B3A5C] flex flex-col items-center justify-center p-8 relative">
      {/* Gold top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />

      <div className="flex items-center gap-4 mb-4 self-start ml-4">
        <div
          className="w-16 h-20 flex-shrink-0"
          dangerouslySetInnerHTML={{ __html: coatOfArmsSvg }}
        />
        <p className="text-amber-400 font-bold text-sm">
          Министерство здравоохранения<br />Московской области
        </p>
      </div>

      <h2 className="text-white text-xl font-bold text-center leading-snug mb-6 max-w-2xl">
        Современное состояние, проблемы и перспективы совершенствования системы охраны здоровья работающих граждан в Московской области
      </h2>

      <div className="flex justify-between items-end w-full mt-auto">
        <div>
          <p className="text-gray-300 text-xs">Докладчик:</p>
          <p className="text-white text-sm font-medium">Иванов Иван Иванович</p>
          <p className="text-gray-400 text-xs">Министр здравоохранения Московской области</p>
        </div>
        <p className="text-amber-400 text-2xl font-bold">2025</p>
      </div>

      {/* Gold bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
    </div>
  );
}

function FinalSlidePreview() {
  return (
    <div className="w-full h-full bg-[#1B3A5C] flex flex-col items-center justify-center p-8 relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />

      <h2 className="text-white text-3xl font-bold mb-4">Спасибо за внимание</h2>
      <p className="text-amber-400 text-lg font-medium text-center mb-6">
        Министерство здравоохранения<br />Московской области
      </p>
      <p className="text-gray-300 text-sm text-center">
        По вопросам сотрудничества и реализации пилотного проекта:
      </p>
      <p className="text-white text-sm font-bold text-center mt-1">
        Центр профессиональной патологии<br />Министерства здравоохранения Московской области
      </p>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
    </div>
  );
}

function ContentSlidePreview({ slide }: { slide: typeof slidesData[0] }) {
  const isProblemsSlide = slide.number === 6 || slide.number === 10 || slide.number === 11;
  const isProposalsSlide = slide.number === 12;

  return (
    <div className="w-full h-full bg-white flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-50 border-b-2 border-[#1B3A5C] px-4 py-2 flex items-center gap-3">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#1B3A5C]" />
        <span className="w-7 h-7 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {slide.number}
        </span>
        <h3 className="text-[#1B3A5C] font-bold text-sm leading-tight">{slide.title}</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {/* Text content */}
        <div className="space-y-1">
          {slide.content.map((line, i) => {
            if (line === '') return <div key={i} className="h-1" />;
            if (i === 0 && !slide.tableData) {
              return (
                <p key={i} className="text-[#1B3A5C] font-bold text-sm mb-2">
                  {line}
                </p>
              );
            }
            const isNegative = line.startsWith('❌');
            const isPositive = line.startsWith('✅') || line.startsWith('📌');
            const isNumbered = /^\d\./.test(line);
            return (
              <p
                key={i}
                className={`
                  text-xs leading-relaxed
                  ${isNegative ? 'text-red-700' : ''}
                  ${isPositive ? 'text-green-700' : ''}
                  ${isNumbered ? 'text-gray-800 font-medium' : ''}
                  ${!isNegative && !isPositive && !isNumbered ? 'text-gray-700' : ''}
                  ${isProblemsSlide && isNegative ? 'pl-2 border-l-2 border-red-400 py-0.5' : ''}
                  ${isProposalsSlide && isNumbered ? 'pl-2 border-l-2 border-blue-400 py-0.5' : ''}
                `}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* Table */}
        {slide.tableData && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {slide.tableData[0].map((header, i) => (
                    <th
                      key={i}
                      className="bg-[#1B3A5C] text-white px-2 py-1.5 text-left font-medium border border-gray-300"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slide.tableData.slice(1).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={rIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    {row.map((cell, cIdx) => {
                      const isNoData = cell === 'нет данных';
                      const hasCheck = cell.includes('✅');
                      const hasCross = cell.includes('❌');
                      const hasWarn = cell.includes('⚠');
                      return (
                        <td
                          key={cIdx}
                          className={`
                            px-2 py-1 border border-gray-200
                            ${isNoData ? 'text-gray-400 italic' : ''}
                            ${hasCheck ? 'text-green-700 bg-green-50' : ''}
                            ${hasCross ? 'text-red-700 bg-red-50' : ''}
                            ${hasWarn ? 'text-orange-600 bg-orange-50' : ''}
                          `}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Accent block */}
        {slide.accentBlock && (
          <div className={`
            mt-3 px-3 py-2 rounded-lg text-xs font-bold text-center
            ${slide.number === 6 || slide.number === 8 || slide.number === 9
              ? 'bg-red-100 text-red-800 border border-red-300'
              : slide.number === 13
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-orange-100 text-orange-800 border border-orange-300'
            }
          `}>
            {slide.accentBlock}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 py-1 border-t border-gray-100">
        Минздрав Московской области | 2025
      </div>
    </div>
  );
}

export default App;
