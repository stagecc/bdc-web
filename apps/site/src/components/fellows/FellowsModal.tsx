import type { ModalRef } from '@trussworks/react-uswds';
import { Modal, ModalHeading } from '@trussworks/react-uswds';
import type { RefObject } from 'react';

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
  modalRef: RefObject<ModalRef | null>;
  fellow: Fellow | null;
}

export const FellowsModal = ({ modalRef, fellow }: Props) => {
  return (
    <Modal
      ref={modalRef}
      id="fellows-modal"
      isLarge
      aria-labelledby="fellows-modal-heading"
    >
      {fellow && (
        <article>
          <div className="display-flex flex-row flex-align-center margin-bottom-2">
            <img
              src={fellow.photo}
              alt={fellow.name}
              className="radius-pill"
              style={{
                width: '150px',
                height: '150px',
                minWidth: '150px',
                objectFit: 'cover',
              }}
            />
            <div className="margin-left-4">
              <ModalHeading id="fellows-modal-heading">
                {fellow.name}
              </ModalHeading>
              <p className="font-sans-lg margin-0">{fellow.university}</p>
              <p className="font-sans-lg margin-0">Cohort {fellow.cohort}</p>
            </div>
          </div>

          <div>
            <h3 className="font-heading-lg margin-bottom-1 line-height-heading-2">
              Biography
            </h3>
            <p className="line-height-body-5">{fellow.bio}</p>

            <h3 className="font-heading-lg margin-bottom-1 line-height-heading-2">
              Project
            </h3>
            <p className="line-height-body-5">
              <strong>{fellow.project.title}: </strong>
              {fellow.project.abstract}
            </p>
          </div>
        </article>
      )}
    </Modal>
  );
};
