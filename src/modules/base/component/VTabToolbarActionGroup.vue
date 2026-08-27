<script setup lang="ts">
/**
 * Groups related actions inside `VTabToolbar`'s append slot and closes them with a vertical separator,
 * so a set of actions that belongs together does not read as part of the tab's own actions.
 *
 * Place it before the ungrouped actions — the separator is trailing, and a group put last would leave
 * it dangling at the toolbar's edge.
 */
</script>

<template>
    <div class="tab-toolbar-action-group">
        <slot/>
        <VDivider vertical class="tab-toolbar-action-group__separator"/>
    </div>
</template>

<style lang="scss" scoped>
.tab-toolbar-action-group {
    display: flex;
    align-items: center;
    // no column gap: the grouped actions sit shoulder to shoulder exactly like the ungrouped ones next
    // to them, so the whole append area reads as one row of icon buttons

    &__separator {
        height: 1.5rem;
        align-self: center;
        // Both gaps around the separator have to come from here. The extra pixel cancels the
        // `margin-left: -1px` Vuetify puts on every vertical divider, which would otherwise make the
        // left gap narrower than the right one.
        margin-inline-start: calc(0.5rem + 1px);
        margin-inline-end: 0.5rem;
    }
}
</style>
