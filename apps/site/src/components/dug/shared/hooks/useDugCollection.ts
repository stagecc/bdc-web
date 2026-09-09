import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type DugCollection,
  EMPTY_COLLECTION,
  loadCollection,
  saveCollection,
} from '../collection';

type DugConceptLike = {
  id: string;
  name: string;
  description: string;
  type: string;
};

type DugStudyLike = {
  c_id: string;
  c_name: string;
  c_link: string;
  source: string;
};

type DugVariableLike = {
  id: string;
  name?: string;
  description?: string;
  e_link?: string;
};

export function useDugCollection() {
  const [collection, setCollection] = useState<DugCollection>(EMPTY_COLLECTION);
  const [hasLoadedCollection, setHasLoadedCollection] = useState(false);

  useEffect(() => {
    setCollection(loadCollection());
    setHasLoadedCollection(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCollection) {
      return;
    }

    saveCollection(collection);
  }, [collection, hasLoadedCollection]);

  const conceptInCollection = useCallback(
    (conceptId: string) =>
      collection.concepts.some((concept) => concept.id === conceptId),
    [collection.concepts],
  );

  const studyInCollection = useCallback(
    (studyId: string) =>
      collection.studies.some((study) => study.id === studyId),
    [collection.studies],
  );

  const variableInCollection = useCallback(
    (variableId: string) =>
      collection.variables.some((variable) => variable.id === variableId),
    [collection.variables],
  );

  const toggleConcept = useCallback((concept: DugConceptLike) => {
    setCollection((previous) => {
      if (previous.concepts.some((item) => item.id === concept.id)) {
        return {
          ...previous,
          concepts: previous.concepts.filter((item) => item.id !== concept.id),
        };
      }

      return {
        ...previous,
        concepts: previous.concepts.concat({
          id: concept.id,
          name: concept.name,
          description: concept.description,
          type: concept.type,
        }),
      };
    });
  }, []);

  const toggleStudy = useCallback((study: DugStudyLike) => {
    setCollection((previous) => {
      if (previous.studies.some((item) => item.id === study.c_id)) {
        return {
          ...previous,
          studies: previous.studies.filter((item) => item.id !== study.c_id),
        };
      }

      return {
        ...previous,
        studies: previous.studies.concat({
          id: study.c_id,
          name: study.c_name,
          url: study.c_link,
          source: study.source,
        }),
      };
    });
  }, []);

  const toggleVariable = useCallback((variable: DugVariableLike) => {
    setCollection((previous) => {
      if (previous.variables.some((item) => item.id === variable.id)) {
        return {
          ...previous,
          variables: previous.variables.filter(
            (item) => item.id !== variable.id,
          ),
        };
      }

      return {
        ...previous,
        variables: previous.variables.concat({
          id: variable.id,
          name: variable.name || variable.id,
          description: variable.description || '',
          url: variable.e_link || '',
        }),
      };
    });
  }, []);

  const removeCollectionItem = useCallback(
    (type: keyof DugCollection, id: string) => {
      setCollection((previous) => ({
        ...previous,
        [type]: previous[type].filter((item) => item.id !== id),
      }));
    },
    [],
  );

  const clearCollection = useCallback(
    () => setCollection(EMPTY_COLLECTION),
    [],
  );

  const collectionCount = useMemo(
    () =>
      collection.concepts.length +
      collection.studies.length +
      collection.variables.length,
    [collection],
  );

  return {
    collection,
    collectionCount,
    hasLoadedCollection,
    conceptInCollection,
    studyInCollection,
    variableInCollection,
    toggleConcept,
    toggleStudy,
    toggleVariable,
    removeCollectionItem,
    clearCollection,
    setCollection,
  };
}
