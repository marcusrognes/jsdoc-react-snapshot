import React from 'react';
import styled from 'styled-components';

const ToDoListWrapper = styled.div`
	width: 100%;
	background: white;
	border: 1px solid gray;
`;

const ToDoListElement = styled.div`
	width: 100%;
	padding: 5px;
	border-bottom: 1px solid gray;
	box-sizing: border-box;
	&:last-child {
		border-bottom: none;
	}
`;

/**
 *
 * @param {{tasks:Array}} props
 * @snapshot "Empty" {"width": 250, "height": 150}
 * return <ToDoList
 *      tasks={[]}
 * />;
 * @snapshot "Tasks" {"width": 250, "height": 150}
 * return <ToDoList
 * 		tasks={[{
 * 			checked: false,
 * 			text: 'Write tests'
 * 		}, {
 * 			checked: true,
 * 			text: 'Do nothing'
 * 		}]}
 * />
 */
export function ToDoList(props) {
	const { tasks } = props;
	return (
		<ToDoListWrapper>
			{(!tasks || tasks.length === 0) && (
				<ToDoListElement>No tasks</ToDoListElement>
			)}
			{tasks &&
				tasks.map((task, i) => (
					<ToDoListElement key={i}>
						<input type="checkbox" checked={task.checked} />
						{task.text}
					</ToDoListElement>
				))}
		</ToDoListWrapper>
	);
}
