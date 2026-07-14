import type { ModalRef } from '@trussworks/react-uswds';
import { useRef, useState } from 'react';
import { sortByLastName } from '../../util/sort-by-lastName';
import { FellowsModal } from './FellowsModal';

interface ProjectData {
  title: string;
  abstract: string;
}

interface Fellow {
  name: string;
  university: string;
  cohort: string;
  bio: string;
  project: ProjectData;
  photo: string;
}

interface Props {
  fellows: Fellow[];
}

export const FellowsGrid = ({ fellows }: Props) => {
  const [selectedFellow, setSelectedFellow] = useState<Fellow | null>(null);
  const modalRef = useRef<ModalRef>(null);

  const handleSelect = (fellow: Fellow) => {
    setSelectedFellow(fellow);
    modalRef.current?.toggleModal(undefined, true);
  };
  // Group fellows by cohort, sorted by cohort order
  const ROMAN_TO_INT: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };

  const byCohort = fellows.reduce(
    (acc, fellow) => {
      const cohort = fellow.cohort;
      if (!acc[cohort]) acc[cohort] = [];
      acc[cohort].push(fellow);
      return acc;
    },
    {} as Record<string, Fellow[]>,
  );

  const cohorts = Object.keys(byCohort).sort(
    (a, b) => (ROMAN_TO_INT[a] ?? 0) - (ROMAN_TO_INT[b] ?? 0),
  );

  // Sort fellows within each cohort alphabetically by last name
  cohorts.forEach((cohort) => {
    byCohort[cohort] = sortByLastName(byCohort[cohort], (fellow) =>
      fellow.name.split(',')[0].trim(),
    );
  });

  return (
    <>
      <div className="padding-y-3">
        {cohorts.map((cohort) => (
          <div key={cohort} className="margin-bottom-4">
            <h2 className="font-sans-sm text-bold border-bottom-1px padding-bottom-1 margin-bottom-1">
              Cohort {cohort}
            </h2>
            <div className="fellows-list margin-x-auto margin-y-3">
              {byCohort[cohort].map((fellow) => (
                <button
                  key={fellow.name}
                  type="button"
                  className="usa-button usa-button--unstyled text-underline display-block text-left margin-bottom-1 line-height-sans-2"
                  onClick={() => handleSelect(fellow)}
                >
                  {fellow.name}
                </button>
              ))}
            </div>
          </div>
        ))}
        <FellowsModal modalRef={modalRef} fellow={selectedFellow} />
      </div>
      <style>{`
        .fellows-list {
          column-count: 1;
        }
        @media (min-width: 480px) { .fellows-list { column-count: 2; } }
        @media (min-width: 640px) { .fellows-list { column-count: 3; } }
        @media (min-width: 1024px) { .fellows-list { column-count: 4; } }
      `}</style>
    </>
  );
};
