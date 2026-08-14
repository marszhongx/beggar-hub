import type { ReactNode } from 'react'

type Col<T> = {
  key: string
  title: string
  width?: string
  render?: (row: T) => ReactNode
}

type TableProps<T> = {
  cols: Col<T>[]
  rows: T[]
  /** 每行唯一键字段（可选，默认用行索引） */
  rowKey?: (row: T) => string
  /** 每行操作列（可选），渲染在最后一列 */
  actions?: (row: T) => ReactNode
  /** 表尾追加一行（如新建行），返回 <tr>…</tr> */
  footerRow?: () => ReactNode
}

export default function Table<T>({ cols, rows, rowKey, actions, footerRow }: TableProps<T>) {
  return (
    <table className="table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key}>{c.title}</th>
          ))}
          {actions && <th></th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={rowKey ? rowKey(row) : i}>
            {cols.map((c) => (
              <td key={c.key} style={c.width ? { width: c.width } : undefined}>
                {c.render ? c.render(row) : ((row as Record<string, unknown>)[c.key] as ReactNode)}
              </td>
            ))}
            {actions && (
              <td>
                <div className="table-actions">{actions(row)}</div>
              </td>
            )}
          </tr>
        ))}
        {footerRow && footerRow()}
      </tbody>
    </table>
  )
}
