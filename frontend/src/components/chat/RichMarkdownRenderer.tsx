import React, { useState } from 'react'
import { Copy, Check, Code } from 'lucide-react'

interface RichMarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Format LaTeX math expression into neat styled typographic HTML
 */
function formatMathExpression(expr: string): string {
  let res = expr.trim()

  // Replace common LaTeX symbols
  res = res.replace(/\\cdot/g, '·')
  res = res.replace(/\\times/g, '×')
  res = res.replace(/\\div/g, '÷')
  res = res.replace(/\\pm/g, '±')
  res = res.replace(/\\mp/g, '∓')
  res = res.replace(/\\leq/g, '≤')
  res = res.replace(/\\geq/g, '≥')
  res = res.replace(/\\neq/g, '≠')
  res = res.replace(/\\approx/g, '≈')
  res = res.replace(/\\infty/g, '∞')
  res = res.replace(/\\Delta/g, 'Δ')
  res = res.replace(/\\delta/g, 'δ')
  res = res.replace(/\\pi/g, 'π')
  res = res.replace(/\\theta/g, 'θ')
  res = res.replace(/\\alpha/g, 'α')
  res = res.replace(/\\beta/g, 'β')
  res = res.replace(/\\lambda/g, 'λ')
  res = res.replace(/\\mu/g, 'μ')
  res = res.replace(/\\sigma/g, 'σ')
  res = res.replace(/\\sum/g, '∑')
  res = res.replace(/\\prod/g, '∏')
  res = res.replace(/\\int/g, '∫')
  res = res.replace(/\\rightarrow/g, '→')
  res = res.replace(/\\Rightarrow/g, '⇒')
  res = res.replace(/\\Leftrightarrow/g, '⇔')
  res = res.replace(/\\in/g, '∈')
  res = res.replace(/\\forall/g, '∀')
  res = res.replace(/\\exists/g, '∃')

  // \sqrt{x} or \sqrt[n]{x}
  res = res.replace(/\\sqrt\[(.*?)\]\{(.*?)\}/g, '<sup>$1</sup>√($2)')
  res = res.replace(/\\sqrt\{(.*?)\}/g, '√($1)')

  // \frac{a}{b} -> (a) / (b) with neat fraction typography
  res = res.replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1 / $2)')

  // Superscripts & Subscripts: x^{2} -> x² or x^2
  res = res.replace(/\^\{(\d+)\}/g, '<sup>$1</sup>')
  res = res.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>')
  res = res.replace(/_\{(\d+)\}/g, '<sub>$1</sub>')
  res = res.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>')

  return res
}

/**
 * Render inline content: Bold, Italic, Code, Math ($...$), Links
 */
function renderInline(text: string): React.ReactNode[] {
  // Split tokens by inline code, inline math, bold, italic
  const tokens: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // 1. Inline code: `...`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      tokens.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // 2. Inline math: $...$
    const mathMatch = remaining.match(/^\$([^$]+)\$/)
    if (mathMatch) {
      const formattedMath = formatMathExpression(mathMatch[1])
      tokens.push(
        <span
          key={`math-${keyIdx++}`}
          className="inline-block font-serif italic px-1 text-indigo-700 dark:text-sky-300 font-medium"
          dangerouslySetInnerHTML={{ __html: formattedMath }}
        />
      )
      remaining = remaining.slice(mathMatch[0].length)
      continue
    }

    // 3. Bold: **...**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      const inner = boldMatch[1]
      // Check if this is a Step badge (Bước 1, Bước 2, Step 1,...)
      const stepMatch = inner.match(/^(Bước\s*\d+|Step\s*\d+):?(.*)/i)
      if (stepMatch) {
        tokens.push(
          <span key={`step-${keyIdx++}`} className="inline-flex items-center gap-1.5 my-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
              {stepMatch[1]}
            </span>
            {stepMatch[2] && <strong className="font-bold text-slate-900 dark:text-white">{stepMatch[2]}</strong>}
          </span>
        )
      } else {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-slate-900 dark:text-white">
            {inner}
          </strong>
        )
      }
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // 4. Italic: *...*
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      tokens.push(
        <em key={`italic-${keyIdx++}`} className="italic">
          {italicMatch[1]}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // 5. Strikethrough: ~~...~~
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      tokens.push(
        <del key={`strike-${keyIdx++}`} className="line-through text-slate-400">
          {strikeMatch[1]}
        </del>
      )
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // 6. Normal plain text slice
    const nextSpecial = remaining.search(/[`$*~]/)
    if (nextSpecial === -1) {
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining}</span>)
      break
    } else if (nextSpecial === 0) {
      // Unmatched symbol, treat as plain text character
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining[0]}</span>)
      remaining = remaining.slice(1)
    } else {
      tokens.push(<span key={`txt-${keyIdx++}`}>{remaining.slice(0, nextSpecial)}</span>)
      remaining = remaining.slice(nextSpecial)
    }
  }

  return tokens
}

/**
 * Code Block Component with copy button
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 text-slate-200 text-xs shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-mono">
          <Code className="w-3.5 h-3.5 text-sky-400" />
          <span>{language || 'code'}</span>
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition px-1.5 py-0.5 rounded hover:bg-slate-700 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[11px] leading-relaxed select-text">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * Main RichMarkdownRenderer Component
 */
export const RichMarkdownRenderer: React.FC<RichMarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null

  // Split lines into blocks
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // 1. Code blocks: ```
    if (line.trim().startsWith('```')) {
      const lang = line.trim().replace(/^```/, '').trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // Skip closing ```
      blocks.push(
        <CodeBlock key={`block-${blockKey++}`} code={codeLines.join('\n')} language={lang} />
      )
      continue
    }

    // 2. Display Math: $$ ... $$
    if (line.trim().startsWith('$$')) {
      const mathLines: string[] = []
      let singleLine = false
      if (line.trim().length > 2 && line.trim().endsWith('$$')) {
        // Single line $$...$$
        mathLines.push(line.trim().slice(2, -2))
        singleLine = true
      } else {
        mathLines.push(line.trim().replace(/^\$\$/, ''))
        i++
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          mathLines.push(lines[i])
          i++
        }
        if (i < lines.length) {
          mathLines.push(lines[i].trim().replace(/\$\$$/, ''))
        }
      }
      if (!singleLine) i++
      else i++

      const expr = mathLines.join(' ').trim()
      const formatted = formatMathExpression(expr)

      blocks.push(
        <div
          key={`block-${blockKey++}`}
          className="my-3 py-2 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-950/60 text-center font-serif text-sm tracking-wide text-indigo-900 dark:text-sky-300 overflow-x-auto shadow-2xs"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
      continue
    }

    // 3. Tables: | col | col |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0].split('|').slice(1, -1).map((c) => c.trim())
        // Line 1 is delimiter: |---|---|
        const bodyRows = tableLines.slice(2).map((row) =>
          row.split('|').slice(1, -1).map((c) => c.trim())
        )

        blocks.push(
          <div key={`block-${blockKey++}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-800 dark:text-slate-200">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        continue
      }
    }

    // 4. Headers: #, ##, ###
    const headerMatch = line.match(/^(#{1,3})\s+(.*)/)
    if (headerMatch) {
      const level = headerMatch[1].length
      const text = headerMatch[2]
      if (level === 1) {
        blocks.push(
          <h2 key={`block-${blockKey++}`} className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 mb-1.5 pb-1 border-b border-slate-200 dark:border-slate-700">
            {renderInline(text)}
          </h2>
        )
      } else if (level === 2) {
        blocks.push(
          <h3 key={`block-${blockKey++}`} className="text-xs font-bold text-slate-900 dark:text-white mt-2.5 mb-1 text-emerald-700 dark:text-emerald-400">
            {renderInline(text)}
          </h3>
        )
      } else {
        blocks.push(
          <h4 key={`block-${blockKey++}`} className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-0.5">
            {renderInline(text)}
          </h4>
        )
      }
      i++
      continue
    }

    // 5. Blockquote: > ...
    if (line.trim().startsWith('>')) {
      const quoteText = line.trim().replace(/^>\s*/, '')
      blocks.push(
        <blockquote
          key={`block-${blockKey++}`}
          className="my-2 pl-3 py-1 border-l-3 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-700 dark:text-slate-300 text-xs italic rounded-r-lg"
        >
          {renderInline(quoteText)}
        </blockquote>
      )
      i++
      continue
    }

    // 6. List items: - or * or numbers
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/)
    if (listMatch) {
      const indent = listMatch[1].length
      const bullet = listMatch[2]
      const text = listMatch[3]

      blocks.push(
        <div key={`block-${blockKey++}`} className={`flex items-start gap-2 my-0.5 ${indent > 0 ? 'ml-4' : 'ml-1'}`}>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 mt-0.5 text-[11px]">
            {bullet.includes('.') ? bullet : '•'}
          </span>
          <div className="flex-1 text-xs leading-relaxed">
            {renderInline(text)}
          </div>
        </div>
      )
      i++
      continue
    }

    // 7. Regular paragraph
    if (line.trim().length === 0) {
      // Empty line -> space divider
      blocks.push(<div key={`block-${blockKey++}`} className="h-1.5" />)
    } else {
      blocks.push(
        <p key={`block-${blockKey++}`} className="my-1 leading-relaxed text-xs">
          {renderInline(line)}
        </p>
      )
    }
    i++
  }

  return <div className={`rich-markdown-container space-y-0.5 ${className}`}>{blocks}</div>
}
export default RichMarkdownRenderer

