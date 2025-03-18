import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlexiGrid } from './base.svelte.js';
import { FreeFormFlexiGrid } from './free-grid.svelte.js';
import type { FlexiWidgetController } from '../widget.svelte';
import type { FlexiTargetConfiguration, InternalFlexiTargetController } from '../target.svelte';

// TODO - for some reason the test suite can't figure out that the FlexiGrid class is available, so this is a hack to fix it
vi.mock('./base.svelte.js', () => ({
    FlexiGrid: class FlexiGrid {
        constructor() {}
        // Mock any methods used in the test
    }
}));

describe('FreeFormFlexiGrid', () => {
    let grid: FreeFormFlexiGrid;
    let mockTarget: InternalFlexiTargetController;
    let targetConfig: FlexiTargetConfiguration;

    const createMockWidget = (x = 0, y = 0, width = 1, height = 1, draggable = true): FlexiWidgetController => {
        const widget = {
            x,
            y,
            width,
            height,
            draggable,
            setBounds: vi.fn().mockImplementation(function(newX: number, newY: number, newWidth: number, newHeight: number) {
                widget.x = newX;
                widget.y = newY;
                widget.width = newWidth;
                widget.height = newHeight;
            }),
            id: `widget-${Math.random().toString(36).substring(2, 9)}`,
        };
        
        return widget as unknown as FlexiWidgetController;
    };

    beforeEach(() => {
        mockTarget = {} as InternalFlexiTargetController;
        targetConfig = {
            baseRows: 5,
            baseColumns: 5,
            layout: {
                type: 'free',
                expandColumns: true,
                expandRows: true,
            },
            rowSizing: 'auto',
            columnSizing: 'auto',
        };
    
        grid = new FreeFormFlexiGrid(mockTarget, targetConfig);
    });

    describe('Basic widget placement', () => {
        it('should place a widget at a specific coordinate', () => {
            const widget = createMockWidget();
      
            const result = grid.tryPlaceWidget(widget, 1, 2, 1, 1);
      
            expect(result).toBe(true);
            expect(widget.setBounds).toHaveBeenCalledWith(1, 2, 1, 1);
        });

        it('should place widgets with different sizes', () => {
        const widget = createMockWidget();
        
        const result = grid.tryPlaceWidget(widget, 1, 1, 2, 3);
        
        expect(result).toBe(true);
        expect(widget.setBounds).toHaveBeenCalledWith(1, 1, 2, 3);
        });

        it('should place a widget at grid boundaries', () => {
        const widget = createMockWidget();
        
        const result = grid.tryPlaceWidget(widget, 4, 4, 1, 1);
        
        expect(result).toBe(true);
        expect(widget.setBounds).toHaveBeenCalledWith(4, 4, 1, 1);
        });
    });

    describe('Collision handling', () => {
        it('should resolve collisions by moving widgets in X direction first', () => {
            const widget1 = createMockWidget();
            const widget2 = createMockWidget();
            
            grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
            const result = grid.tryPlaceWidget(widget2, 1, 1, 1, 1);
            
            expect(result).toBe(true);
            expect(widget1.setBounds).toHaveBeenCalledWith(2, 1, 2, 2);
        });

        it('should resolve collisions by moving widgets in Y direction when X fails', () => {
            // First place a widget at (1,1) with width 2, height 2
            const widget1 = createMockWidget();
            grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
            
            // Place another widget at (3,1) to block X-movement for widget1
            const widget2 = createMockWidget();
            grid.tryPlaceWidget(widget2, 3, 1, 2, 2);
            
            // Now try to place a widget at (1,1) which should force widget1 down
            const widget3 = createMockWidget();
            const result = grid.tryPlaceWidget(widget3, 1, 1, 2, 1);
            
            expect(result).toBe(true);
            expect(widget1.setBounds).toHaveBeenCalledWith(1, 2, widget1.width, widget1.height);
        });

        it('should fail when collision cannot be resolved', () => {
            // Create a non-draggable widget at (1,1)
            const widget1 = createMockWidget(1, 1, 2, 2, false);
            grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
            
            // Try to place another widget at the same position
            const widget2 = createMockWidget();
            const result = grid.tryPlaceWidget(widget2, 1, 1, 1, 1);
            
            expect(result).toBe(false);
        });

        it('should fail when colliding with a non-draggable widget', () => {
            // Create a non-draggable widget at (1,1)
            const widget1 = createMockWidget(0, 0, 0, 0, false);
            grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
            
            // Try to place another widget at the same position
            const widget2 = createMockWidget();
            const result = grid.tryPlaceWidget(widget2, 1, 1, 1, 1);
            
            expect(result).toBe(false);
        });
    });

    describe('Grid expansion', () => {
        it('should expand columns when placing outside grid boundaries', () => {
        const widget = createMockWidget();
        
        const result = grid.tryPlaceWidget(widget, 4, 1, 3, 1);
        
        expect(result).toBe(true);
        expect(grid.columns).toBeGreaterThan(5);
        });

        it('should expand rows when placing outside grid boundaries', () => {
        const widget = createMockWidget();
        
        const result = grid.tryPlaceWidget(widget, 1, 4, 1, 3);
        
        expect(result).toBe(true);
        expect(grid.rows).toBeGreaterThan(5);
        });

        it('should not expand when expansion is disabled', () => {
            // Create a grid with expansion disabled
            const noExpandConfig = {
                ...targetConfig,
                layout: {
                    type: 'free',
                    expandColumns: false,
                    expandRows: false,
                },
            };
            const restrictedGrid = new FreeFormFlexiGrid(mockTarget, {
                ...noExpandConfig,
                layout: {
                    type: "free",
                    expandColumns: false,
                    expandRows: false,
                }
            });
            
            const widget = createMockWidget();
            
            const result = restrictedGrid.tryPlaceWidget(widget, 5, 1, 1, 1);
            
            expect(result).toBe(false);
        });

        it('should not expand beyond MAX_COLUMNS', () => {
        // Create a widget that would exceed MAX_COLUMNS (32)
        const widget = createMockWidget();
        
        // Using a very wide widget to attempt to exceed MAX_COLUMNS
        const result = grid.tryPlaceWidget(widget, 1, 1, 33, 1);
        
        expect(result).toBe(false);
        });
    });

  describe('Widget removal', () => {
    it('should remove a widget from the grid', () => {
      const widget = createMockWidget();
      grid.tryPlaceWidget(widget, 1, 1, 2, 2);
      
      const result = grid.removeWidget(widget);
      
      expect(result).toBe(true);
      
      // Now we should be able to place another widget in the same location
      const widget2 = createMockWidget();
      const placeResult = grid.tryPlaceWidget(widget2, 1, 1, 2, 2);
      
      expect(placeResult).toBe(true);
    });
  });

  describe('Snapshot and restoration', () => {
    it('should take a snapshot and restore from it', () => {
      // Place a few widgets
      const widget1 = createMockWidget();
      const widget2 = createMockWidget();
      
      grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
      grid.tryPlaceWidget(widget2, 3, 3, 1, 1);
      
      // Take a snapshot
      const snapshot = grid.takeSnapshot();
      
      // Clear the grid
      grid.clear();
      
      // Place a new widget where widget1 was
      const widget3 = createMockWidget();
      grid.tryPlaceWidget(widget3, 1, 1, 1, 1);
      
      // Restore from snapshot
      grid.restoreFromSnapshot(snapshot);
      
      // Verify widgets were restored with correct position
      expect(widget1.setBounds).toHaveBeenCalledWith(1, 1, 2, 2);
      expect(widget2.setBounds).toHaveBeenCalledWith(3, 3, 1, 1);
    });
  });

  describe('Edge cases', () => {
    it('should handle placing at (0,0)', () => {
      const widget = createMockWidget();
      
      const result = grid.tryPlaceWidget(widget, 0, 0, 1, 1);
      
      expect(result).toBe(true);
      expect(widget.setBounds).toHaveBeenCalledWith(0, 0, 1, 1);
    });

    it('should handle complex collision scenarios with multiple widgets', () => {
      // Create a grid with widgets that form a specific pattern
      const widget1 = createMockWidget();
      const widget2 = createMockWidget();
      const widget3 = createMockWidget();
      
      grid.tryPlaceWidget(widget1, 1, 1, 2, 2);
      grid.tryPlaceWidget(widget2, 3, 1, 1, 3);
      
      // This should cause a cascade of moves
      const result = grid.tryPlaceWidget(widget3, 1, 1, 3, 1);
      
      expect(result).toBe(true);
      // widget1 should have moved down
      expect(widget1.setBounds).toHaveBeenCalledWith(1, 2, 2, 2);
    });
  });
});
