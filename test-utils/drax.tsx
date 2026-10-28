import type React from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";

type SortableOptions = {
  data: unknown[];
  keyExtractor: (item: never, index: number) => string;
  onReorder: (event: { fromIndex: number; toIndex: number }) => void;
  onDragStart?: (event: unknown) => void;
  onDragEnd?: (event: unknown) => void;
};

let lastOptions: SortableOptions | undefined;

/**
 * Stands for `react-native-drax` in specs. A drag needs gestures and layout
 * Jest does not have, so the list renders its rows in order, each sortable
 * item keeps the props it was given (`draxItemProps`), and a spec ends a drag
 * through `dragRow`.
 */
export const draxModule = {
  DraxProvider: ({ children }: { children?: React.ReactNode }) => children,
  SortableContainer: ({ children }: { children?: React.ReactNode }) => children,
  DraxHandle: ({ children }: { children?: React.ReactNode }) => children,
  SortableItem: ({
    children,
    sortable: _sortable,
    ...props
  }: {
    children?: React.ReactNode;
    sortable: unknown;
  }) => (
    <View {...({ testID: "drax-item", draxItemProps: props } as ViewProps)}>
      {children}
    </View>
  ),
  useSortableList: (options: SortableOptions) => {
    lastOptions = options;
    return {
      data: options.data,
      onScroll: () => {},
      onContentSizeChange: () => {},
      stableKeyExtractor: options.keyExtractor,
      _internal: {},
    };
  },
};

/** Drags the row at `fromIndex` to `toIndex` and drops it there. */
export const dragRow = (fromIndex: number, toIndex: number) => {
  if (!lastOptions) throw new Error("No sortable list on screen");
  lastOptions.onDragStart?.({ index: fromIndex });
  lastOptions.onReorder({ fromIndex, toIndex });
  lastOptions.onDragEnd?.({ index: fromIndex, toIndex, cancelled: false });
};
