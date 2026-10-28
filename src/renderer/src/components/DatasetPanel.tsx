import type { Dataset } from '@core/types'
import { formatNumber } from '@renderer/lib/format'
interface DatasetPanelProps {
  dataset: Dataset
}

export function DatasetPanel({ dataset }: DatasetPanelProps): React.JSX.Element {
  return (
    <section className="panel dataset-panel">
      <div className="panel-heading">
        <h2>Dataset</h2>
        <span>
          {dataset.rows.length} rows · {dataset.columns.length} columns
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <colgroup>
            {dataset.columns.map((column) => (
              <col key={column} style={{ width: `${100 / dataset.columns.length}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {dataset.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.slice(0, 8).map((row, index) => (
              <tr key={index}>
                {dataset.columns.map((column) => (
                  <td key={column}>{formatNumber(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dataset.rows.length > 8 ? (
        <p className="table-note">Showing the first 8 of {dataset.rows.length} rows.</p>
      ) : null}
    </section>
  )
}
