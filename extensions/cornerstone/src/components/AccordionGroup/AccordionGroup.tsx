import React from 'react';
import { useSystem } from '@ohif/core';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

export type AccordionGrouping = {
  [name: string]: unknown;
};

export type AccordionGroupProps = {
  grouping: AccordionGrouping;
};

/**
 * Searches for the required type from the provided allChildren list and
 * renders them.
 */
export const CloneChildren = props => {
  const { group, allChildren, children, childType, defaultTypes } = props;

  const subType = group?.subType;

  for (const child of allChildren) {
    if (subType && child.props?.subType !== subType) {
      continue;
    }
    if (childType && child.type === childType) {
      console.log('Found type element', props.name, group?.name);
      return React.cloneElement(child, { ...props, children: child.props.children });
    }
    if (defaultTypes?.indexOf(child.type) === -1) {
      console.log('Found default element', props.name, group?.name);
      return childType({ ...props, children: child });
    }
  }

  if (!children) {
    throw new Error(`No children defined for ${props.name} CloneChildren in group ${group?.name}`);
  }
  console.log('Rendering children', props.name, group?.name);
  return React.cloneElement(children, props);
};

/** Used to exclude defaults */
const DEFAULT_TYPES = [GroupAccordion, Content, Trigger];

/**
 * An AccordionGroup is a component that splits a set of items into different
 * groups according to a set of grouping rules.  It then puts the groups
 * into a set of accordion folds selected from the body of the accordion group,
 * looking for matching trigger/content sections according to the type definition
 * in the group with first one found being used.
 *
 * This design allows for easy customization of the component by declaring grouping
 * functions with default grouping setups and then only overriding the specific
 * children needing to be changed.  See the PanelMeasurement for some example
 * possibilities of how to modify the default grouping, or the test-extension
 * measurements panel for a practical, working example.
 */
export function AccordionGroup(props) {
  const { grouping, items, children, sourceChildren, type } = props;
  const childProps = useSystem();
  let defaultValue = props.defaultValue;
  const groups = grouping.groupingFunction(items, grouping, childProps);

  if (!defaultValue) {
    const defaultGroup = groups.values().find(group => group.isSelected);
    defaultValue = defaultGroup?.key || defaultGroup?.title;
  }

  const valueArr =
    (Array.isArray(defaultValue) && defaultValue) || (defaultValue && [defaultValue]) || [];
  const sourceChildrenArr = sourceChildren ? React.Children.toArray(sourceChildren) : [];
  const childrenArr = children ? React.Children.toArray(children) : [];
  const allChildren = sourceChildrenArr.concat(childrenArr);

  console.log('Rendering clone children on accordion group', grouping.name);
  return (
    <CloneChildren
      allChildren={allChildren}
      groups={groups}
      childType={GroupAccordion}
      grouping={grouping}
      defaultValue={valueArr}
      name={'grouping ' + grouping.name}
    >
      <DefaultAccordion name="DefaultAccordion" />
    </CloneChildren>
  );
}

function DefaultAccordion(props) {
  const { groups, defaultValue, grouping, allChildren, noWrapper } = props;
  if (!allChildren || !groups) {
    return null;
  }

  if (Boolean(noWrapper)) {
    return React.cloneElement(props.children, props);
  }

  console.log('Rendering DefaultAccordion', grouping?.name);

  return (
    <Accordion
      type={grouping.type || 'multiple'}
      className="text-white"
      defaultValue={defaultValue}
    >
      {[...groups.entries()].map(([key, group]) => {
        return (
          <AccordionItem
            key={group.key + '-i'}
            value={group.key}
          >
            <CloneChildren
              allChildren={allChildren}
              group={group}
              childType={Trigger}
              name="AccordionGroup.Trigger"
            />
            <CloneChildren
              allChildren={allChildren}
              group={group}
              childType={Content}
              defaultTypes={DEFAULT_TYPES}
              name="AccordionGroup.Content"
            />
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function GroupAccordion(props) {
  const { groups, children } = props;
  if (!groups) {
    return null;
  }
  return [...groups.values()].map(group =>
    React.cloneElement(children, { ...props, children: children.props.children, group, ...group })
  );
}

function Content(props) {
  const { group, children } = props;
  if (!group) {
    return null;
  }
  return (
    <AccordionContent>
      {React.cloneElement(children, { ...group, ...props, children: children.props.children })}
    </AccordionContent>
  );
}

function Trigger(props) {
  const { group } = props;
  if (!group) {
    return null;
  }
  return TriggerRender(props);
}

function TriggerRender(props) {
  const { children, group } = props;
  return (
    <AccordionTrigger value={group.value}>
      {React.cloneElement(children, { ...group, ...props, children: children.props.children })}
    </AccordionTrigger>
  );
}

AccordionGroup.Content = Content;
AccordionGroup.Trigger = Trigger;
AccordionGroup.Accordion = GroupAccordion;

export default AccordionGroup;
